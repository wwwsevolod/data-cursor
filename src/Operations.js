
const defaultReplace = ({
    getMutableValue, cursor, updateMutableValue, changeThisInParent, args
}) => {
    let newValue = args[0];

    let mutableValue = getMutableValue();

    if (newValue !== mutableValue) {
        newValue = mutableValue = updateMutableValue(newValue);
    }

    changeThisInParent(mutableValue);

    return cursor;
};

const defaultValueGetter = ({getValue}) => getValue();

export class Operations {
    constructor(operators, mutabilityHelpers) {
        this.operators = operators || new Map();
        this.mutabilityHelpers = mutabilityHelpers || new Map();
    }

    merge(operations) {
        this.operators = new Map([...this.operators, ...operations.operators]);
        this.mutabilityHelpers = new Map([...this.mutabilityHelpers, ...operations.mutabilityHelpers]);
    }

    setOperatorsForType(Type, methodsHashMap) {
        Object.keys(methodsHashMap).forEach((key) => {
            if (typeof methodsHashMap[key] === 'function') {
                if (!this.operators.has(Type)) {
                    this.operators.set(Type, []);
                }

                const arr = this.operators.get(Type);

                arr.push({
                    key,
                    value: methodsHashMap[key]
                });
            }
        });
    }

    setMutabilityHelperForType(Type, mutabilityHelper) {
        this.mutabilityHelpers.set(Type, mutabilityHelper);
    }

    getOperatorsForValue(value) {
        const operators = [{
            key: 'replaceIt',
            value: defaultReplace
        }, {
            key: 'value',
            value: defaultValueGetter
        }];

        if (value && value.constructor !== Object && value instanceof Object && this.operators.has(Object)) {
            operators.push(...this.operators.get(Object));
        }

        if (value !== undefined && value !== null && this.operators.has(value.constructor)) {
            operators.push(...this.operators.get(value.constructor));
        }

        return operators;
    }

    getMutableVersionForValue(value) {
        if (value && value instanceof Object) {
            const mutabilityHelper = this.mutabilityHelpers.get(value.constructor);
            
            if (mutabilityHelper) {
                return mutabilityHelper(value);
            }

            const defaultObjectMutabilityHelper = this.mutabilityHelpers.get(Object);
            
            if (defaultObjectMutabilityHelper) {
                return defaultObjectMutabilityHelper(value);
            }

            throw new Error(`There is no mutabilityHelper for type '${
                value.constructor.name
            }' neither for Object`);
        }

        return value;
    }

    clone() {
        return new Operations(
            new Map(this.operators),
            new Map(this.mutabilityHelpers)
        );
    }
}

export const defaultOperations = new Operations();

defaultOperations.setMutabilityHelperForType(Object, (value) => Object.assign({}, value));

defaultOperations.setOperatorsForType(Object, {
    get({cursor, getNestedCursor, args}) {
        const [key] = args;

        return getNestedCursor(key, cursor.value()[key]);
    },

    mergeLeft({args, getMutableValue, cursor}) {
        const currentValue = getMutableValue();

        Object.assign(currentValue, ...args);

        return cursor.replaceIt(currentValue);
    },

    mergeRight({args, getMutableValue, cursor}) {
        return cursor.replaceIt(Object.assign({}, ...args, getMutableValue()));
    },

    delete({args, getMutableValue, cursor}) {
        const [key] = args;

        const value = getMutableValue();

        delete value[key];

        cursor.replaceIt(value);

        return cursor;
    },

    set({args, getMutableValue, cursor}) {
        const [key, value] = args;

        const mutableValue = getMutableValue();

        mutableValue[key] = value;

        cursor.replaceIt(mutableValue);

        return cursor;
    }
});

defaultOperations.setMutabilityHelperForType(Array, (value) => value.slice());

defaultOperations.setOperatorsForType(Array, {
    length({cursor}) {
        return cursor.value().length;
    },

    push({args, getMutableValue, cursor}) {
        const mutableValue = getMutableValue();

        mutableValue.push(...args);

        cursor.replaceIt(mutableValue);

        return cursor;
    },

    pop({getMutableValue, cursor}) {
        const mutableValue = getMutableValue();

        mutableValue.pop();

        cursor.replaceIt(mutableValue);

        return cursor;
    },

    shift({getMutableValue, cursor}) {
        const mutableValue = getMutableValue();

        mutableValue.shift();

        cursor.replaceIt(mutableValue);

        return cursor;
    },

    unshift({args, getMutableValue, cursor}) {
        const mutableValue = getMutableValue();

        mutableValue.unshift(...args);

        cursor.replaceIt(mutableValue);

        return cursor;
    }
});

defaultOperations.setOperatorsForType(Number, {
    increment({args, cursor}) {
        const [incrementBy] = args;

        cursor.replaceIt(cursor.value() + (incrementBy === undefined ? 1 : incrementBy));
    },

    decrement({args, cursor}) {
        const [decrementBy] = args;

        cursor.replaceIt(cursor.value() - (decrementBy === undefined ? 1 : decrementBy));
    }
});

if (typeof Map === 'function') {
    defaultOperations.setMutabilityHelperForType(Map, (value) => new Map(value));

    defaultOperations.setOperatorsForType(Map, {
        get({cursor, getNestedCursor, args}) {
            const [key] = args;

            return getNestedCursor(key, cursor.value().get(key));
        },

        delete({args, getMutableValue, cursor}) {
            const [key] = args;

            const value = getMutableValue();

            value.delete(key);

            cursor.replaceIt(value);

            return cursor;
        },

        set({args, getMutableValue, cursor}) {
            const [key, value] = args;

            const mutableValue = getMutableValue();

            mutableValue.set(key, value);

            cursor.replaceIt(mutableValue);

            return cursor;
        }
    });
}

if (typeof Set === 'function') {
    defaultOperations.setMutabilityHelperForType(Set, (value) => new Set(value));
}


