import { FieldAPI, FieldExtensionSDK } from '@contentful/app-sdk';
import {
  Field as DefaultFieldEditor,
  FieldWrapper as DefaultFieldWrapper,
} from '@contentful/default-field-editors';
import { useSDK,  } from '@contentful/react-apps-toolkit';
import { useMemo, useRef } from 'react';

type DefaultFieldWrapperProps = typeof DefaultFieldWrapper extends React.FC<infer Props> ? Props : never;
type DefaultFieldProps = typeof DefaultFieldEditor extends React.FC<infer Props> ? Props : never;

interface FieldWrapperProps extends Omit<DefaultFieldWrapperProps, 'sdk'> {
  field: FieldAPI;
}

interface FieldProps extends Omit<DefaultFieldProps, 'sdk'> {
  field: FieldAPI;
}

function usePatchedSdk(field: FieldAPI): FieldExtensionSDK {
  const sdk = useSDK<FieldExtensionSDK>();

  const fieldRef = useRef<FieldAPI>(field);
  fieldRef.current = field;

  const handler = useMemo<ProxyHandler<FieldExtensionSDK>>(() => ({
    get(target, p, receiver) {
      if (p === 'field') {
        return fieldRef.current;
      }
      return Reflect.get(target, p, receiver);
    },
  }), []);

  const patchedSdk = useMemo(() => {
    return new Proxy(sdk, handler);
  }, [sdk, handler]);

  return patchedSdk;
}


export function FieldWrapper({ field, showFocusBar = false, ...props }: FieldWrapperProps) {
  const sdk = usePatchedSdk(field);
  return <DefaultFieldWrapper sdk={sdk} {...props} showFocusBar={showFocusBar} />;
}

export function Field({ field, ...props}: FieldProps) {
  const sdk = usePatchedSdk(field);
  return <DefaultFieldEditor sdk={sdk} {...props} />;
}
