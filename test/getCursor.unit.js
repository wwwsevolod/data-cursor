import getCursor from 'getCursor';

describe('getCursor', () => {
    it('should work', () => {
        let state = {
            keyA: {
                keyB: {
                    keyC: {
                        number: 123,
                        array: [1, {
                            value: 456
                        }, 3]
                    }
                }
            }
        };

        const rootCursor = getCursor(state);
        
        // If nothing was changed, cursor's value must be equal to original object
        expect(rootCursor.value() === state).to.be.true;

        const keyBCursor = rootCursor.get('keyA').get('keyB');
        const keyCCursor = keyBCursor.get('keyC');

        const numberCursor = keyCCursor.get('number');

        expect(numberCursor.value()).to.equals(123);
        expect(rootCursor.value()).to.have.deep.property('keyA.keyB.keyC.number').to.equals(123);

        const keyBCursorOriginalValue = keyBCursor.value();
        expect(keyBCursor.value()).to.equals(keyBCursorOriginalValue);

        numberCursor.replaceIt(1);

        expect(keyBCursor.value()).not.to.equals(keyBCursorOriginalValue);
        expect(keyCCursor.value().number).to.equals(1);

        const obj = {
            asd: 123
        };

        rootCursor.get('keyA').get('keyB').replaceIt(obj);

        expect(rootCursor.value()).to.have.deep.property('keyA.keyB.asd').to.equals(123);
        expect(rootCursor.value() === state).to.be.false;

        // If object was set on key it must be recreated to be mutable from inside,
        // to avoid mutations on original object
        expect(state.keyA.keyB !== obj).to.be.true;

        numberCursor.replaceIt(2);

        expect(rootCursor.value()).to.have.deep.property('keyA.keyB.asd').to.equals(123);
        expect(rootCursor.value()).not.to.have.deep.property('keyA.keyB.keyC');

        rootCursor.get('keyA').get('keyB').replaceIt({
            keyC: keyCCursor.value()
        });

        expect(rootCursor.value().keyA.keyB.keyC.number).to.equals(1);

        expect(rootCursor.value()).to.have.deep.property('keyA.keyB.keyC.number').to.equals(1);

        numberCursor.replaceIt(123);
        expect(rootCursor.value().keyA.keyB.keyC.number).to.equals(1);
    });


});
