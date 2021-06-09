import isPlainObject_ = require('is-plain-obj');

export type AnyPlainObject = Record<string | number | symbol, unknown>;

export const isPlainObject = isPlainObject_;
