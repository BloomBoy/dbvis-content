import {
  FieldAPI,
  FieldConnectorChildProps,
} from '@contentful/field-editor-shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual';
import { SerializedJSONValue, ValidationError } from '@contentful/app-sdk';
import useConfigurableFieldAPI, {
  ConfigurableFieldAPI,
  useSubFieldAPI,
} from './useConfigurableFieldAPI';
import { getDeepValue, modifyDeepValue } from '../utils/deepValue';

type Nullable = null | undefined;

type FieldConnectorParams<ValueType> = {
  field: FieldAPI | null;
  isInitiallyDisabled?: boolean;
  isEmptyValue?: (value: ValueType | null) => boolean;
  isEqualValues?: (
    value1: ValueType | Nullable,
    value2: ValueType | Nullable,
  ) => boolean;
  throttle?: number;
};

export interface ExtendedFieldConnectorChildProps<ValueType>
  extends FieldConnectorChildProps<ValueType> {
  setImmediateValue: (newValue: ValueType | Nullable) => Promise<SerializedJSONValue | undefined>;
  configurableFieldAPI: ConfigurableFieldAPI | null;
}

export default function useFieldEditor<ValueType>({
  field,
  isInitiallyDisabled = false,
  isEmptyValue = (value: ValueType | Nullable) => {
    return value === null || value === '';
  },
  isEqualValues = (
    value1: ValueType | Nullable,
    value2: ValueType | Nullable,
  ) => {
    return isEqual(value1, value2);
  },
  throttle: throttleVal = 300,
}: FieldConnectorParams<ValueType>): ExtendedFieldConnectorChildProps<ValueType> {
  const fieldRef = useRef(field);
  fieldRef.current = field;
  const isEmptyValueRef = useRef(isEmptyValue);
  isEmptyValueRef.current = isEmptyValue;
  const isEqualValuesRef = useRef(isEqualValues);
  isEqualValuesRef.current = isEqualValues;

  const configurableFieldAPI = useConfigurableFieldAPI(field);

  const [state, setState] = useState<
    Omit<ExtendedFieldConnectorChildProps<ValueType>, 'setValue' | 'setImmediateValue'>
  >(() => {
    const initialValue: ValueType | Nullable = field?.getValue();

    return {
      isLocalValueChange: false,
      externalReset: 0,
      value: initialValue ?? undefined,
      lastRemoteValue: initialValue ?? undefined,
      disabled: isInitiallyDisabled,
      errors: [],
      configurableFieldAPI,
    };
  });

  const setFieldValue = useCallback<NonNullable<typeof field>['setValue']>(
    (value) => {
      console.log('setting value:', value);
      if (fieldRef.current) {
        return fieldRef.current.setValue(value);
      }
      return Promise.resolve(undefined);
    },
    [],
  );

  const setImmediateValue = useCallback((value: ValueType | Nullable) => {
    return new Promise<SerializedJSONValue | undefined>(
      (resolve, reject) => {
        if (isEmptyValueRef.current(value ?? null)) {
          fieldRef.current
            ?.removeValue()
            .then(() => resolve(undefined), reject);
        } else {
          setFieldValue(value).then(resolve, reject);
        }
      },
    );
  }, [setFieldValue])

  const triggerSetValueCallbacks = useMemo(() => {
    return throttle(
      (value: ValueType | Nullable) => {
        return new Promise<SerializedJSONValue | undefined>(
          (resolve, reject) => {
            if (isEmptyValueRef.current(value ?? null)) {
              fieldRef.current
                ?.removeValue()
                .then(() => resolve(undefined), reject);
            } else {
              setFieldValue(value).then(resolve, reject);
            }
          },
        );
      },
      throttleVal,
      {
        leading: throttleVal === 0,
      },
    );
  }, [setFieldValue, throttleVal]);

  const setValue = useCallback(
    (newValue: ValueType | Nullable) => {
      setState((currentState) => ({
        ...currentState,
        value: newValue ?? undefined,
      }));
      return Promise.resolve<SerializedJSONValue | undefined>(
        triggerSetValueCallbacks(newValue),
      );
    },
    [triggerSetValueCallbacks],
  );

  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;

  const onSchemaErrorsChanged = field?.onSchemaErrorsChanged;
  useEffect(() => {
    return onSchemaErrorsChanged?.call(
      fieldRef.current,
      (errors: ValidationError[]) => {
        setState((currentState) => ({
          ...currentState,
          errors: errors || emptyErrors,
        }));
      },
    );
  }, [onSchemaErrorsChanged]);
  const onIsDisabledChanged = field?.onIsDisabledChanged;
  useEffect(() => {
    return onIsDisabledChanged?.call(fieldRef.current, (disabled: boolean) => {
      setState((currentState) => ({
        ...currentState,
        disabled,
      }));
    });
  }, [onIsDisabledChanged]);

  const onValueChanged = field?.onValueChanged;
  useEffect(() => {
    return onValueChanged?.call(
      fieldRef.current,
      (value: ValueType | Nullable) => {
        setState((currentState) => {
          const isLocalValueChange = isEqualValuesRef.current(
            value,
            currentState.value,
          );
          const lastRemoteValue = isLocalValueChange
            ? currentState.lastRemoteValue
            : value;
          const externalReset =
            currentState.externalReset + (isLocalValueChange ? 0 : 1);
          return {
            ...currentState,
            value,
            lastRemoteValue,
            isLocalValueChange,
            externalReset,
          };
        });
      },
    );
  }, [onValueChanged]);

  return useMemo(
    () => ({
      ...state,
      setImmediateValue,
      setValue,
    }),
    [setImmediateValue, setValue, state],
  );
}

const emptyErrors: never[] = [];

const SUBFIELD_CONFIG = Symbol('subfieldConfig');

interface SubFieldConnectorChildProps<ValueType>
  extends ExtendedFieldConnectorChildProps<ValueType> {
  [SUBFIELD_CONFIG]: {
    path: (string | number)[] | null;
    parent: ExtendedFieldConnectorChildProps<any>;
  };
}

export function isExtendedFieldEditor(
  fieldEditor: FieldConnectorChildProps<any>,
): fieldEditor is ExtendedFieldConnectorChildProps<any> {
  return (
    'configurableFieldAPI' in fieldEditor &&
    typeof (fieldEditor as { configurableFieldAPI?: unknown })
      .configurableFieldAPI === 'object'
  );
}

function isSubfieldEditor(
  fieldEditor: FieldConnectorChildProps<any>,
): fieldEditor is SubFieldConnectorChildProps<any> {
  return isExtendedFieldEditor(fieldEditor) && SUBFIELD_CONFIG in fieldEditor;
}

export function useSubFieldEditor<T extends {}>(
  fieldEditor: ExtendedFieldConnectorChildProps<any>,
  path: string | number | (string | number)[] | null,
): SubFieldConnectorChildProps<T> {
  const subfieldConfig = isSubfieldEditor(fieldEditor)
    ? fieldEditor[SUBFIELD_CONFIG]
    : null;
  const baseFieldEditor = subfieldConfig ? subfieldConfig.parent : fieldEditor;
  const resolvedPath = useMemo(() => {
    if (path === null) {
      return null;
    }
    return [
      ...(subfieldConfig?.path ?? []),
      ...(Array.isArray(path) ? path : [path]),
    ];
  }, [subfieldConfig, path]);
  const deepValue = useMemo(
    () => resolvedPath && getDeepValue(baseFieldEditor.value, resolvedPath),
    [baseFieldEditor, resolvedPath],
  );
  const deepValueRef = useRef(deepValue);
  deepValueRef.current = deepValue;
  const deepLastRemoteValue = useMemo(
    () =>
      resolvedPath &&
      resolvedPath.reduce(
        (cur, key) => cur?.[key],
        baseFieldEditor.lastRemoteValue,
      ),
    [baseFieldEditor, resolvedPath],
  );
  const deepLastRemoteValueRef = useRef(deepLastRemoteValue);
  deepLastRemoteValueRef.current = deepLastRemoteValue;
  const baseValueRef = useRef(baseFieldEditor.value);
  baseValueRef.current = baseFieldEditor.value;

  const setBaseValue = baseFieldEditor.setValue;
  const setValue = useMemo(() => {
    function setDeepValue(value: T | null | undefined) {
      if (resolvedPath == null) return Promise.resolve();
      return setBaseValue(
        modifyDeepValue(baseValueRef.current, resolvedPath, value),
      );
    }
    return setDeepValue;
  }, [setBaseValue, resolvedPath]);
  const setImmediateBaseValue = baseFieldEditor.setImmediateValue;
  const setImmediateValue = useMemo(() => {
    function setDeepValue(value: T | null | undefined) {
      if (resolvedPath == null) return Promise.resolve(undefined);
      return setImmediateBaseValue(
        modifyDeepValue(baseValueRef.current, resolvedPath, value),
      );
    }
    return setDeepValue;
  }, [resolvedPath, setImmediateBaseValue]);

  const baseConfigurableFieldAPI = fieldEditor.configurableFieldAPI;

  const configurableFieldAPI = useSubFieldAPI(baseConfigurableFieldAPI, resolvedPath);

  return useMemo<SubFieldConnectorChildProps<T>>(() => {
    return {
      ...baseFieldEditor,
      [SUBFIELD_CONFIG]: {
        path: resolvedPath,
        parent: baseFieldEditor,
      },
      configurableFieldAPI,
      errors: emptyErrors,
      lastRemoteValue: deepLastRemoteValue,
      value: deepValue,
      setValue,
      setImmediateValue
    };
  }, [baseFieldEditor, resolvedPath, configurableFieldAPI, deepLastRemoteValue, deepValue, setValue, setImmediateValue]);
}
