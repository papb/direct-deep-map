import { isPlainObject, AnyPlainObject } from './is-plain-object';

type LooseMapper = readonly [((value: any) => any) | LooseMapper] | {
	[key: string]: ((value: any) => any) | LooseMapper;
};

function isLooseMapperOrFunction(mapper: unknown): boolean {
	if (typeof mapper === 'function') return true;
	if (!mapper || typeof mapper !== 'object') return false;
	if (Array.isArray(mapper)) {
		return mapper.length === 1 ? isLooseMapperOrFunction(mapper[0]) : false;
	}
	if (!isPlainObject(mapper)) return false;
	return Object.values(mapper).every(x => isLooseMapperOrFunction(x));
}

function assertLooseMapper(mapper: unknown): asserts mapper is LooseMapper {
	const ok = typeof mapper !== 'function' && isLooseMapperOrFunction(mapper);
	if (!ok) throw new TypeError('The deep mapper must be a tree whose leaves are functions and whose nodes are plain objects or length-1 arrays.');
}

type CastAsLooseMapper<T> = T extends LooseMapper ? T : never;

export type MappedTree<T, Tr> =
	Tr extends LooseMapper
		? T extends readonly any[]
			? {
				[K in keyof T]: Tr[0] extends (value: any) => infer R
					? R
					: MappedTree<T[K], CastAsLooseMapper<Tr[0]>>
			}
			: T extends AnyPlainObject
				? {
					[K in keyof T]: K extends keyof Tr
						? (
							Tr[K] extends (value: any) => infer R
								? R
								: MappedTree<T[K], CastAsLooseMapper<Tr[K]>>
						)
						: T[K]
				}
				: T
		: never;

function directDeepMapHelper(tree: any, mapper: any): any {
	if (typeof mapper === 'function') return mapper(tree); // eslint-disable-line @typescript-eslint/no-unsafe-call
	if (!tree || typeof tree !== 'object') return tree;
	if (Array.isArray(tree)) {
		if (!Array.isArray(mapper) || mapper.length === 0) return tree;
		return tree.map(value => directDeepMapHelper(value, mapper[0]));
	}
	if (!isPlainObject(tree)) return tree;
	const result: AnyPlainObject = {};
	for (const key of Object.keys(tree)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		result[key] = mapper[key] ? directDeepMapHelper(tree[key], mapper[key]) : tree[key];
	}
	return result;
}

export type Mapper<T> =
	T extends ReadonlyArray<infer X>
		? readonly [((value: X) => any) | Mapper<X>]
		: T extends AnyPlainObject
			? {
				[K in keyof T]?: ((value: T[K]) => any) | Mapper<T[K]>;
			}
			: never;

export function directDeepMap<T, Tr extends Mapper<T>>(tree: T, deepMapper: Tr): MappedTree<T, Tr> {
	if (typeof deepMapper !== 'object') throw new TypeError(`The deep mapper must be an array or object, got ${typeof deepMapper}`);
	assertLooseMapper(deepMapper);
	return directDeepMapHelper(tree, deepMapper) as unknown as MappedTree<T, Tr>;
}
