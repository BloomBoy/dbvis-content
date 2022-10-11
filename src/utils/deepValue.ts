export const DELETE = Symbol('delete');

const INCOMPATIBLE_CHILD_PATH = Symbol('incompatibleChildPath');


function cloneValue<T>(obj: T): T {
  if (typeof obj === 'object' && obj !== null) {
    return Array.isArray(obj) ? ([...obj] as T) : { ...obj };
  }
  return obj;
}

function keyToString(key: string | number | { index: number, id?: string }): string {
  if (typeof key === 'object') {
    return `[${key.index}${key.id ? `(${key.id})` : ''}]`;
  }
  if (typeof key === 'string') {
    return `.${key}`;
  }
  return `[${key}]`;
}

export function pathToString(path: (string | number | { index: number, id?: string })[], base?: string): string {
  if (base) {
    return `${base}${path.map(keyToString).join('')}`;
  }
  return path.map(keyToString).join('').replace(/^\./, '');
}

class IncompatibleChildPathError extends Error {
  obj: unknown;

  constructor(path: (string | number | { index: number, id?: string })[], faultIndex: number, obj: unknown, val: unknown, expectedType: string) {
    super(`Incompatible child path at index ${faultIndex} (${pathToString(path.slice(0, faultIndex))}) of path ${pathToString(path)}: expected ${expectedType}, got ${IncompatibleChildPathError.objectType(val)}`);
    this.obj = obj;
  }

  private static objectType(obj: unknown) {
    if (obj === null) return 'null';
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) return 'array';
      return Object.prototype.toString.call(obj);
    }
    return typeof obj;
  }
}

export function modifyDeepValue(obj: any, path: (string | number | { index: number, id?: string })[], value: any) {
  const newBaseValue = cloneValue(obj);
  const res = path.reduce((cur, key, index, arr) => {
    if (cur instanceof IncompatibleChildPathError) {
      return cur;
    }
    if (typeof cur !== 'object') {
      return new IncompatibleChildPathError(arr, index, obj, cur, 'object | array');
    }
    const accessKey = typeof key === 'object' ? key.index : key;
    if (typeof accessKey === 'number') {
      if (!Array.isArray(cur)) {
        return new IncompatibleChildPathError(arr, index, obj, cur, 'array');
      }
    }
    if (typeof accessKey !== 'number' && Array.isArray(cur)) {
      return new IncompatibleChildPathError(arr, index, obj, cur, 'object');
    }
    if (index === arr.length - 1) {
      if (value === DELETE) {
        delete cur[accessKey];
        return undefined;
      }
      cur[accessKey] = value;
      return value;
    }
    let next: unknown = cloneValue(cur[accessKey]);
    if (next == null) {
      if (typeof arr[index + 1] === 'number') {
        next = [];
      } else {
        next = {};
      }
    }
    cur[accessKey] = next;
    return next;
  }, newBaseValue);
  if (res instanceof IncompatibleChildPathError) {
    throw res;
  }
  return newBaseValue;
}

export function getDeepValue(value: any, path: (string | number | { index: number, id?: string })[]): any {
  return path.reduce((currentValue, key) => {
    if (currentValue === undefined) {
      return undefined;
    }
    return currentValue[typeof key === 'object' ? key.index : key];
  }, value);
}
