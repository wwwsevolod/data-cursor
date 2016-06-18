import {defaultOperations} from './Operations';

const CURSOR_SYMBOL = '@@IS_CURSOR' + Math.random();

let isOperationInProcess = false;
let currentOperationName = '';
let operationPath = null;
let initialOperationArgs = null;

function _getCursor(
    currentValue,
    operations,
    changeParentProperty,
    transactionDescriptor,
    currentPathKey,
    isRoot
) {
    let mutableValue = null;
    let mutableValueCreated = false;
    let isSetMutableValueToParent = false;

    function checkTransactionState() {
        if (transactionDescriptor.isClosed) {
            throw new Error('Cursor is closed becauze transaction ended');
        }
    }

    const childChangeParentProperty = (key, newValue, prevValue) => {
        if (cursor.get(key).value() === prevValue) {
            cursor.set(key, newValue);
        }
    };

    function getMutableValue() {
        if (!mutableValueCreated) {
            mutableValue = operations.getMutableVersionForValue(currentValue);
            mutableValueCreated = true;
        }

        return mutableValue;
    }

    let lastSetValue = currentValue;

    let operators = operations.getOperatorsForValue(currentValue);

    function getNestedCursor(keyPath, value) {
        return _getCursor(
            value,
            operations,
            childChangeParentProperty,
            transactionDescriptor,
            keyPath,
            false
        );
    }

    function updateMutableValue(newValue) {
        mutableValue = operations.getMutableVersionForValue(newValue);
        mutableValueCreated = true;

        return mutableValue;
    }

    function changeThisInParent(newValue) {
        if (isRoot) {
            changeParentProperty(
                newValue,
                lastSetValue,
                operationPath,
                currentOperationName,
                initialOperationArgs
            );
        } else {
            changeParentProperty(
                currentPathKey,
                newValue,
                lastSetValue,
                operationPath,
                currentOperationName,
                initialOperationArgs
            );
        }
    }

    const cursor = operators.reduce((accum, {key, value}) => {
        accum[key] = (...args) => {
            if (!isOperationInProcess) {
                checkTransactionState();

                isOperationInProcess = true;

                initialOperationArgs = args;
                currentOperationName = key;

                operationPath = [];
            }

            if (!isRoot) {
                operationPath.push(currentPathKey);
            }

            const result = value({
                cursor,
                args,

                getNestedCursor,
                getMutableValue,
                updateMutableValue,
                changeThisInParent,

                getValue() {
                    return mutableValueCreated ? mutableValue : currentValue;
                }
            });

            isOperationInProcess = false;
            initialOperationArgs = null;
            operationPath = null;
            currentOperationName = '';

            return result;
        };

        return accum;
    }, {});

    Object.defineProperty(cursor, CURSOR_SYMBOL, {
        value: true,
        writable: false,
        enumerable: false
    });

    return cursor;
}

export default function getCursor(
    currentValue,
    operations = defaultOperations,
    changeParentProperty = () => {},
    transactionDescriptor = {isClosed: false}
) {
    return _getCursor(
        currentValue,
        operations,
        changeParentProperty,
        transactionDescriptor,
        '',
        true
    );
}