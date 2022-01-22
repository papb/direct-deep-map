import test from 'ava';
import cloneDeep = require('lodash.clonedeep');
import { expectTypeOf } from 'expect-type';
import { tsAssertTypesExactlyEqual, tsAssertStrictExtends } from '@papb/assorted-ts-utils/assert';
import { isPlainObject } from '../source/is-plain-object';
import { directDeepMap, MappedTree } from '../source';

test('Readme example', t => {
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
				foo: { bar: (x: number) => 3 * x },
			},
		],
	} as const;

	const result = directDeepMap(tree, tripleBarsMapper);

	t.not(tree, result);

	const expectedResult = {
		items: [
			{
				foo: { bar: 12 },
			},
			{
				foo: { bar: 21, baz: true },
			},
			{
				foo: { baz: 'hello' },
			},
		],
	};

	tsAssertStrictExtends()<typeof expectedResult>()<typeof result>();

	t.deepEqual(result, expectedResult);
});

test('Basic usage', t => {
	const result = directDeepMap(
		// prettier-ignore
		{ a: [{ b: 'hi', c: 123 }, { d: 'hey', b: 'there' }] } as const,
		{ a: [{ b: () => 'hello' as const }] } as const,
	);

	// prettier-ignore
	const expectedResult = { a: [{ b: 'hello', c: 123 }, { d: 'hey', b: 'hello' }] } as const;

	expectTypeOf(result).toEqualTypeOf(expectedResult);

	t.deepEqual(result, expectedResult);
});

test('TypeScript support', t => {
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

	const result = directDeepMap(tree, {
		items: [
			{
				foo: {
					bar: x => {
						tsAssertTypesExactlyEqual()<typeof x>()<number[] | undefined>();
						return x!.join('-');
					},
				},
			},
		],
	});

	expectTypeOf(result).toEqualTypeOf<{
		items: Array<{
			foo: {
				bar?: string;
				baz?: boolean;
			};
		}>;
	}>();

	t.deepEqual(result, {
		items: [
			{
				foo: { bar: '1-2-3' },
			},
			{
				foo: { bar: '4-5', baz: true },
			},
			{
				foo: { baz: false },
			},
		],
	});

	const mapper = {
		items: [
			{
				foo: {
					bar: (x?: number[]) => x!.join('-'),
				},
			},
		],
	} as const;

	directDeepMap(tree, mapper);
});

test('Does not modify input', t => {
	// prettier-ignore
	const tree = { a: [{ b: 'hi', c: 123 }, { d: 'hey', b: 'there' }] };
	const treeMemo = cloneDeep(tree);

	const result = directDeepMap(tree, { a: [{ b: () => 'hello' }] });

	// Sanity check for the test
	t.notDeepEqual(result, treeMemo as any);

	// Real test
	t.deepEqual(tree, treeMemo);
});

test('Does not mess with non-plain objects', t => {
	// prettier-ignore
	expectTypeOf<MappedTree<{ foo: Date; bar: Date }, { foo: { getTime: () => 'modified' } }>>()
		.toEqualTypeOf<{ foo: Date; bar: Date }>();

	const date = new Date();

	// `is-plain-object` sanity check
	t.true(isPlainObject({}));
	t.false(isPlainObject(null));
	t.false(isPlainObject(date));

	const tree = [date, date, { getTime: 'something' }];
	const result = directDeepMap(tree, [{ getTime: () => 'modified' }]);
	const expected = [date, date, { getTime: 'modified' }];

	t.deepEqual(result, expected);
	t.not(result[0]!.getTime, 'modified');
	t.is(result[0], result[1]);
});

test('Leaves non-trees untouched', t => {
	// prettier-ignore
	expectTypeOf<MappedTree<Date, { a: () => 1 }>>()
		.toEqualTypeOf<Date>();

	// prettier-ignore
	expectTypeOf<MappedTree<Date, { getTime: () => string }>>()
		.toEqualTypeOf<Date>();

	// prettier-ignore
	expectTypeOf<MappedTree<number, { a: () => 1 }>>()
		.toEqualTypeOf<number>();

	// prettier-ignore
	expectTypeOf<MappedTree<undefined, { a: () => 1 }>>()
		.toEqualTypeOf<undefined>();

	const date = new Date();

	// @ts-expect-error TS complains about the following call, as intended
	t.is(directDeepMap(date, { getTime: () => 'modified' }), date);
	t.is(typeof date.getTime, 'function');
});
