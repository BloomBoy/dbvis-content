export const DELETE = Symbol('delete');

const INCOMPATIBLE_CHILD_PATH = Symbol('incompatibleChildPath');


function cloneValue<T>(obj: T): T {
  if (typeof obj === 'object' && obj !== null) {
    return Array.isArray(obj) ? ([...obj] as T) : { ...obj };
  }
  return obj;
}

export function modifyDeepValue(obj: any, path: (string | number)[], value: any) {
  const newBaseValue = cloneValue(obj);
  const res = path.reduce((cur, key, index, arr) => {
    if (cur === INCOMPATIBLE_CHILD_PATH) {
      return INCOMPATIBLE_CHILD_PATH;
    }
    if (typeof cur !== 'object') {
      return INCOMPATIBLE_CHILD_PATH;
    }
    if (typeof key === 'number') {
      if (!Array.isArray(cur)) {
        return INCOMPATIBLE_CHILD_PATH;
      }
    }
    if (typeof key !== 'number' && Array.isArray(cur)) {
      return INCOMPATIBLE_CHILD_PATH;
    }
    if (index === arr.length - 1) {
      if (value === DELETE) {
        delete cur[key];
        return undefined;
      }
      cur[key] = value;
      return value;
    }
    let next: unknown = cloneValue(cur[key]);
    if (next == null) {
      if (typeof arr[index + 1] === 'number') {
        next = [];
      } else {
        next = {};
      }
    }
    cur[key] = next;
    return next;
  }, newBaseValue);
  if (res === INCOMPATIBLE_CHILD_PATH) {
    throw new Error(
      `Incompatible child path: baseValue${path
        .map((key) => (typeof key === 'number' ? `[${key}]` : `.${key}`))
        .join(
          '',
        )}. Encountered a non-object value while traversing. Or an array when expecting an object. Or vice versa`,
    );
  }
  return newBaseValue;
}

export function getDeepValue(value: any, path: (string | number)[]): any {
  return path.reduce((currentValue, key) => {
    if (currentValue === undefined) {
      return undefined;
    }
    return currentValue[key];
  }, value);
}
