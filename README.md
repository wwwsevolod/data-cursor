# data-cursor.js

## What is it?

This library is for traversing and modifying nested data structures, without mutating original objects.

It was originally developed as `react-addons-update` replacement for me, because only declarative method of describing state transitions is hard. Especially when you need conditions for certain operations, need to create your own operations or massivly change big structures, without creating too many intermidiate values.

This library is like `Immutable.js`, but for any data types, not just that provided by `Immutable.js`.

## Features

1. You can effectively update complex structures
2. You can track changes, where and when they're occured
3. You can add your own operations on any data type (DOCS MISSING, HELP WANTED).

Also, you can track changes, where and when it occured, if you use this library for data manipulation.

## Simple API documentation to start with

Example with `react-addons-update`:

```js
    import update from 'react-addons-update';

    const state = {
        nested: {
            object: {
                withArray: [{
                    value: 'value'
                }]
            }
        }
    };

    const updateCommand = {
        newPlainKey: {
            $set: 'value in plain key'
        },

        nested: {
            object: {
                oneMoreKey: {
                    $set: 'oneMoreValue'
                }
            }
        }
    };

    if (Math.random() > 0.5) {
        updateCommand.nested.object.oneMoreKey2 = 'oneMoreValue2';
    }

    const newState = update(state, updateCommand);
```

Turn's into this with data-cursor:

```js
    import {getCursor} from 'data-cursor';

    const state = {
        nested: {
            object: {
                withArray: [{
                    value: 'value'
                }]
            }
        }
    };

    const cursor = getCursor(state);
    // cursor.get('nested').get('object').get('withArray').get(0).get('value').value()) === 'value'
    // (cursor.value() === state) === true


    const originalNestedObjectValue = cursor.get('nested').get('object').value();
    cursor.set('newPlainKey', 'value in plain key');

    // (cursor.value() === state) === false
    // (cursor.get('nested').get('object').value() === originalNestedObjectValue) === true

    cursor.get('nested').get('object').set('oneMoreKey', 'oneMoreValue');
    // (cursor.get('nested').get('object').value() === originalNestedObjectValue) === false
    // cursor.get('newPlainKey').value() === 'value in plain key'

    if (Math.random() > 0.5) {
        cursor.get('nested').get('object').set('oneMoreKey2', 'oneMoreValue2');
    }

    const newState = cursor.value();
```

## API Documentation

### import {getCursor} from 'data-cursor'

```js
getCursor(
    state : any, // pass here value to use cursor
    operations : Operations // optional instance of Operations, defaults to `defaultOperations`
    onChange : function(
        newValue : any,
        previousValue : any,

        /*
            this arguments could be used for tracking changes granlullary
            but you must not expect change notification when you change one object to another for every key that different,
            just notification about object change, example:

            getCursor({test: {value: 123, anotherValue: 456}}, undefined, (_, _, path, name) => console.log(
                changePath,
                name
            )).get('test').replaceIt({
                value: 456,
                anotherValue: 456
            }); // ['test'], 'replaceIt'
        */
        changePath : Array<any>,
        operationThatCausedChange : string, // operation name, like 'set' or 'push'
        operationArguments : Array<any> // arguments that was passed to operation described before
    ), // optional change handler

    // Transaction object. Cursors must be used synchronously, for consistancy's sake, so if you want to forbid changes on cursor,
    // you can close it with this object just changing it's fiels 'isClosed'
    transactionDescriptor = {isClosed: false}
)
```


## TODO (Help wanted!)

1. Simplify API for `Operations` descriptors
2. Changes on `defaultOperations` must be forbidden
3. More examples with other libraries (like: how to use it with redux)
4. Split up tests
5. Write tests on `Operations`
6. Create build scripts for all popular formats, like ES6 for rollup, UMD for everyone else, etc.
7. Use `Object.freeze` in `process.env.NODE_ENV === 'development'` for incoming data structures.
8. More documentation and usage examples on advanced getCursor arguments
9. Documentation on `Operations`. (How to add your own types and operations on them, why it's add `object` operations to every `instanceof Object`, etc).
9. More docs!
