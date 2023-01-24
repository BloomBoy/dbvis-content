type Keys<
  T extends readonly unknown[] | { readonly [key: string | number]: unknown },
> = T extends readonly unknown[]
  ?
      | Exclude<keyof T & string, keyof [] | `${number}`>
      | `${number extends {
          readonly [key in keyof T]: key;
        }[Extract<keyof T, `${number}`>]
          ? `${number}`
          : {
              readonly [key in keyof T]: key;
            }[Extract<keyof T, `${number}`>]}`
  : keyof T extends number
  ? `${keyof T}`
  : keyof T & string;

export function objectEntries<In extends { readonly [key: string]: unknown }>(
  input: In,
) {
  return Object.entries(input) as {
    [key in keyof In]: [key, In[key]];
  }[keyof In & string][];
}

export function arrayEntries<In extends { readonly [key: string]: unknown }>(
  input: In,
) {
  return Object.entries(input) as {
    [key in keyof In]: [key, In[key]];
  }[Keys<In>][];
}
    
type FromEntry<T extends readonly [string, unknown]> = (
  T extends unknown ? () => { [key in T[0]]: T[1] } : never
) extends () => infer R
  ? (R extends unknown ? (k: R) => void : never) extends (k: infer I) => void
    ? I
    : never
  : never;

export function fromEntries<In extends readonly (readonly [string, unknown])[]>(
  input: In,
) {
  return Object.fromEntries(input) as {
    [key in keyof FromEntry<In[number]>]: FromEntry<In[number]>[key];
  };
}

export function objectKeys<
  In extends readonly unknown[] | { readonly [key: string]: unknown },
>(input: In): readonly Keys<In>[] {
  return Object.keys(input) as Keys<In>[];
}

type MappedTuple<
  T extends readonly unknown[],
  Fns extends { [key in keyof T]: (value: T[key]) => unknown },
> = {
  [key in keyof T]: ReturnType<Fns[key]>;
};

export function tupleMap<
  T extends readonly unknown[],
  Fn extends (value: T[number]) => unknown,
>(input: T, fn: Fn) {
  return input.map(fn) as MappedTuple<
    T,
    {
      [key in keyof T]: Fn extends (value: T[key]) => infer Q
        ? (value: T[key]) => Q
        : Fn;
    }
  >;
}
