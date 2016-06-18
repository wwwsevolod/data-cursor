import {defaultOperations} from 'Operations';

describe('defaultOperations', () => {
    it('should work', () => {
        const arr = [];

        expect(defaultOperations.getMutableVersionForValue(arr)).to.deep.equals(arr);
        expect(defaultOperations.getMutableVersionForValue(arr)).not.to.equals(arr);

        const operators = defaultOperations.getOperatorsForValue(arr);
    });
});
