# direct-deep-map ![Build Status](https://github.com/papb/direct-deep-map/workflows/CI/badge.svg) [![install size](https://packagephobia.com/badge?p=direct-deep-map)](https://packagephobia.com/result?p=direct-deep-map)

> Deep map values in a tree directly on the desired places, with strong TypeScript support. Original tree is unchanged.

## Install

```
$ npm install direct-deep-map
```

Note: if you're using TypeScript, you will need TypeScript 4.1 or above (tested until 4.5).

## Usage

```js
const { directDeepMap } = require('direct-deep-map');

const tree = {
    items: [
        {
            foo: { bar: 4 },
        },
        {
            foo: { bar: 7, baz: true },
        },
        {
            foo: { baz: 'hello' },
        },
    ],
};

const tripleBarsMapper = {
    items: [
        {
            foo: { bar: x => 3 * x },
        },
    ],
};

const newTree = directDeepMap(tree, tripleBarsMapper);

console.log(newTree);
//=> {
//   items: [
//     {
//       foo: { bar: 12 }
//     },
//     {
//       foo: { bar: 21, baz: true }
//     },
//     {
//       foo: { baz: 'hello' }
//     }
//   ]
// };

console.log(tree !== newTree);
//=> true
```

## API

### directDeepMap(tree, deepMapper)

#### tree

Type: Anything

If it is indeed a tree (i.e. an array or plain object), it will be deep-cloned and modified with the mapper. Otherwise, it will be returned unchanged.

The provided `tree` is unchanged.

#### deepMapper

Type: array or plain object

A tree-structure resembling the tree to be modified, but whose leaves are the mapping functions to apply.

The original tree will be traversed in BFS order and the corresponding mapper function within `deepMapper` (if present) will be used to transform the values.

## TypeScript support

This module supports TypeScript by default. The return type of the `directDeepMap` method is properly constructed. Example:

```ts
import { directDeepMap } from 'direct-deep-map';

type OriginalTreeType = {
    items: Array<{
        foo: {
            bar?: number[];
            baz?: boolean;
        };
    }>;
};

const tree: OriginalTreeType = {
    items: [
        {
            foo: { bar: [1, 2, 3] },
        },
        {
            foo: { bar: [4, 5], baz: true },
        },
        {
            foo: { baz: false },
        },
    ],
};

const newTree = directDeepMap(tree, {
    items: [
        {
            foo: {
                // Type of `x` is automatically inferred to be `number[] | undefined` here
                bar: x => x!.join('-'),
            },
        },
    ],
});
type NewTreeType = typeof newTree;
//=> {
//   items: Array<{
//     foo: {
//       bar?: string;
//       baz?: boolean;
//     };
//   }>;
// }
```

Note that, in the example above, the mapper was defined as an object inline with the function call to `directDeepMap`. If you instead wish to define it separately, like in the first example in this readme, you will need to use `as const` when defining it:

```ts
const tree: OriginalTreeType = {
    items: [
        {
            foo: { bar: [1, 2, 3] },
        },
        {
            foo: { bar: [4, 5], baz: true },
        },
        {
            foo: { baz: false },
        },
    ],
};

const mapper = {
    items: [
        {
            foo: {
                bar: (x?: number[]) => x!.join('-'),
            },
        },
    ],
} as const;

const newTree = directDeepMap(tree, mapper);
```

## Known issues & roadmap for v1.0.0

-   Support circular references (currently, the call will hang)
-   Support `Set`
-   Support `Map`
-   Improve documentation adding more examples
-   Support modifying the tree in-place instead of deep-cloning via an option (false by default)
-   Provide element index as second argument to the mapper function when mapping over elements in an array

## Related

-   [`deep-map`](https://github.com/mcmath/deep-map): Map over all primitive leaf values in a tree (instead of specifying specific positions since the beginning) - more flexible but less precise TypeScript typings.
-   [`tree-shortcut`](https://github.com/papb/tree-shortcut): Simplify an object tree with a shortcut. TypeScript supported.

## License

MIT © [Pedro Augusto de Paula Barbosa](https://github.com/papb)
