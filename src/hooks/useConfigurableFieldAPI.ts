import { FieldAPI } from '@contentful/app-sdk';
import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { modifyDeepValue, getDeepValue, DELETE } from '../utils/deepValue';
import { fromEntries } from '../utils/objects';

export const SUBFIELDAPI_CONFIG = Symbol('subfieldConfig');

const FIELD_API_CONFIG_KEYS = [
  'required',
  'validations',
  'items',
  'type',
] as const;

export type ConfigurableFieldAPI = Omit<
  FieldAPI,
  typeof FIELD_API_CONFIG_KEYS[number]
> & {
  readonly [SUBFIELDAPI_CONFIG]: {
    readonly path: (string | number)[];
    readonly parent: FieldAPI;
  };
};

const hookKeys = [
  'onValueChanged',
  'onIsDisabledChanged',
  'onSchemaErrorsChanged',
] as const;

type MapEntries<O, K extends readonly (keyof O)[]> = {
  [key in keyof K]: [K[key], O[K[key]]];
};

function useFieldAPIHooks(field: FieldAPI | null, path: any[] | null) {
  const fieldRef = useRef(field);
  fieldRef.current = field;

  const registeredHooks = useRef<{
    [key in typeof hookKeys[number]]?: {
      [key: symbol]: [
        args: Parameters<FieldAPI[key]>,
        unlisten: (() => void) | null,
      ];
      registered: Set<symbol>;
    };
  }>({});

  useEffect(() => {
    if (!field) {
      return;
    }
    const hookRef = registeredHooks.current;
    hookKeys.forEach((key) => {
      const curHook = hookRef[key];
      if (curHook == null) return;
      curHook.registered.forEach((symbol) => {
        const current = curHook[symbol];
        const [args, unlisten] = current;
        if (unlisten) {
          unlisten();
        }
        current[1] = field[key].apply(field, args);
      });
    });
    return () => {
      hookKeys.forEach((key) => {
        const curHook = hookRef[key];
        if (curHook == null) return;
        curHook.registered.forEach((symbol) => {
          const current = curHook[symbol];
          const [, unlisten] = current;
          current[1] = null;
          if (unlisten) {
            unlisten();
          }
        });
      });
    };
  }, [field]);

  return useMemo(() => {
    return fromEntries(
      hookKeys.map(<K extends typeof hookKeys[number]>(key: K) => {
        const curHook: typeof registeredHooks.current[typeof key] =
          registeredHooks.current[key] ?? {
            registered: new Set(),
          };
        registeredHooks.current[key] = curHook;
        const registerHook = (...args: Parameters<FieldAPI[typeof key]>) => {
          const curField = fieldRef.current;
          let unlisten =
            curField != null ? curField[key].apply(curField, args) : null;
          const symbol = Symbol(Math.random().toString().slice(2, 10));
          curHook[symbol] = [args, unlisten];
          curHook.registered.add(symbol);
          return () => {
            if (curHook.registered.has(symbol)) {
              const [, unlisten] = curHook[symbol];
              if (unlisten) unlisten();
              curHook.registered.delete(symbol);
              delete curHook[symbol];
            }
          };
        };
        return [key, registerHook] as MapEntries<
          FieldAPI,
          typeof hookKeys
        >[number];
      }),
    );
  }, [path]);
}

export function useSubFieldAPI(
  fieldAPI: ConfigurableFieldAPI | null,
  path: (string | number | (string | number)[]) | null,
): ConfigurableFieldAPI | null {
  const baseField = fieldAPI?.[SUBFIELDAPI_CONFIG]?.parent ?? null;
  const basePath = fieldAPI?.[SUBFIELDAPI_CONFIG]?.path ?? null;
  const resolvedPath = useMemo(
    () =>
      path == null || basePath == null
        ? null
        : [...basePath, ...(Array.isArray(path) ? path : [path])],
    [basePath, path],
  );

  const wrappedSetValue = useCallback<FieldAPI['setValue']>(
    (value) => {
      if (baseField == null || resolvedPath == null) {
        return Promise.resolve(undefined);
      }
      if (resolvedPath.length === 0) {
        return baseField.setValue(value);
      }
      return baseField.setValue(
        modifyDeepValue(baseField.getValue(), resolvedPath, value),
      );
    },
    [baseField, resolvedPath],
  );

  const wrappedGetValue = useCallback<FieldAPI['getValue']>(() => {
    if (baseField == null || resolvedPath == null) {
      return undefined;
    }
    if (resolvedPath.length === 0) {
      return baseField.getValue();
    }
    return getDeepValue(baseField.getValue(), resolvedPath);
  }, [baseField, resolvedPath]);

  const wrappedRemoveValue = useCallback<FieldAPI['removeValue']>(async () => {
    if (baseField == null || resolvedPath == null) {
      return Promise.resolve(undefined);
    }
    if (resolvedPath.length === 0) {
      return baseField.removeValue();
    }
    await baseField.setValue(
      modifyDeepValue(baseField.getValue(), resolvedPath, DELETE),
    );
  }, [baseField, resolvedPath]);

  const [initialValue] = useState(() => {
    if (baseField == null || resolvedPath == null) {
      return undefined;
    }
    if (resolvedPath.length === 0) {
      return baseField.getValue();
    }
    return getDeepValue(baseField.getValue(), resolvedPath);
  });
  const lastValue = useRef(initialValue);

  const { onValueChanged, ...hooks } = useFieldAPIHooks(baseField, resolvedPath);

  const wrappedOnValueChanged = useCallback<typeof onValueChanged>(
    (callback) => {
      return onValueChanged((value) => {
        const newValue =
          resolvedPath == null ? undefined : getDeepValue(value, resolvedPath);
        if (newValue !== lastValue.current) {
          lastValue.current = newValue;
          callback(newValue);
        }
      });
    },
    [onValueChanged, resolvedPath],
  );

  const subField = useMemo<ConfigurableFieldAPI | null>(() => {
    if (baseField == null || resolvedPath == null) {
      return null;
    }
    return {
      id: `${baseField.id}${resolvedPath
        .map((key) => (typeof key === 'number' ? `[${key}]` : `.${key}`))
        .join('')}`,
      locale: baseField.locale,
      setInvalid(...args) {
        return baseField.setInvalid(...args);
      },
      getValue: wrappedGetValue,
      setValue: wrappedSetValue,
      removeValue: wrappedRemoveValue,
      onValueChanged: wrappedOnValueChanged,
      ...hooks,
      [SUBFIELDAPI_CONFIG]: {
        path: resolvedPath,
        parent: baseField,
      },
    };
  }, [
    baseField,
    hooks,
    resolvedPath,
    wrappedGetValue,
    wrappedOnValueChanged,
    wrappedRemoveValue,
    wrappedSetValue,
  ]);

  return subField;
}

export default function useConfigurableFieldAPI(
  field: FieldAPI | null,
): ConfigurableFieldAPI | null {
  const hooks = useFieldAPIHooks(field, []);

  const configurableField = useMemo<ConfigurableFieldAPI | null>(() => {
    if (field == null) {
      return null;
    }
    return {
      [SUBFIELDAPI_CONFIG]: {
        path: [],
        parent: field,
      },
      id: field.id,
      locale: field.locale,
      getValue(...args) {
        return field.getValue(...args);
      },
      setValue(...args) {
        return field.setValue(...args);
      },
      removeValue(...args) {
        return field.removeValue(...args);
      },
      setInvalid(...args) {
        return field.setInvalid(...args);
      },
      ...hooks,
    };
  }, [field, hooks]);

  return configurableField;
}
