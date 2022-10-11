import type { Channel } from '@contentful/app-sdk/dist/channel';
import type { Signal } from '@contentful/app-sdk/dist/signal';
import { ConnectMessage, EditorInterface, EditorLocaleSettings, EntryAPI, EntryFieldAPI, EntryFieldInfo, FieldAPI, FieldInfo, init, Items, KnownSDK, Metadata, SharedEditorSDK, TaskAPI, ValidationError } from '@contentful/app-sdk';
import { SDKContext, SDKProvider } from '@contentful/react-apps-toolkit';
import React, { useContext, useEffect, useState } from 'react';

const customInit = init as unknown as <T extends KnownSDK>(initCb: (sdk: T, customSdk: CustomSDK) => any, options: {
  makeCustomApi(...args: ConstructorParameters<typeof CustomSDK>): CustomSDK;
}) => void;

const DELAY_TIMEOUT = 4 * 1000;

export const CustomSDKContext = SDKContext as React.Context<{
  sdk: KnownSDK | null;
  customSdk?: CustomSDK;
}>;

export function CustomSDKProvider(...[props]: Parameters<typeof SDKProvider>): ReturnType<typeof SDKProvider> {
  const [value, setSDK] = useState<React.ContextType<typeof CustomSDKContext>>();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      console.warn(
        "Your app is taking longer than expected to initialize. If you think this is an error with Contentful's App SDK, let us know: https://github.com/contentful/ui-extensions-sdk/issues"
      );
    }, DELAY_TIMEOUT);
    customInit((sdk: KnownSDK, customSdk) => {
      setSDK({ sdk, customSdk });
      window.clearTimeout(timeout);
    }, {
      makeCustomApi(channel: Channel, params: ConnectMessage) {
        return new CustomSDK(channel, params);
      }
    });
    return () => window.clearTimeout(timeout);
  }, []);

  if (!value || !value.sdk) {
    if (props.loading) {
      return props.loading;
    }
    return null;
  }

  return (
    <CustomSDKContext.Provider value={value}>
      {props.children}
    </CustomSDKContext.Provider>
  );
}


let fieldClassesCache: ReturnType<typeof createFieldClasses> | undefined;
function createFieldClasses(signalClass: typeof Signal) {
  const memArgsSymbol = '__private__memoized__arguments__';
  class MemoizedSignal extends signalClass {
    private [memArgsSymbol]: any[] = []
  
    constructor(...memoizedArgs: any[]) {
      super()
  
      if (!memoizedArgs.length) {
        throw new Error('Initial value to be memoized expected')
      }
  
      this[memArgsSymbol] = memoizedArgs
    }
  
    dispatch(...args: any[]) {
      this[memArgsSymbol] = args
      super.dispatch(...args)
    }
  
    attach(listener: Function) {
      /*
       * attaching first so that we throw a sensible
       * error if listener is not a function without
       * duplication of is function check
       */
      const detachListener = super.attach(listener)
  
      listener(...this[memArgsSymbol])
      return detachListener
    }
  }
  class FieldLocale implements FieldAPI {
    id: string
    locale: string
    type: string
    required: boolean
    validations: any[]
    items?: Items
    private _value: any
  
    private _valueSignal: MemoizedSignal
    private _isDisabledSignal: MemoizedSignal
    private _schemaErrorsChangedSignal: MemoizedSignal
    private _channel: any
  
    constructor(channel: Channel, info: FieldInfo) {
      this.id = info.id
      this.locale = info.locale
      this.type = info.type
      this.required = info.required
      this.validations = info.validations
      this.items = info.items
  
      this._value = info.value
      this._valueSignal = new MemoizedSignal(this._value)
      this._isDisabledSignal = new MemoizedSignal(undefined)
      this._schemaErrorsChangedSignal = new MemoizedSignal(undefined)
      this._channel = channel
  
      channel.addHandler('valueChanged', (id: string, locale: string, value: any) => {
        if (id === this.id && (!locale || locale === this.locale)) {
          this._value = value
          this._valueSignal.dispatch(value)
        }
      })
  
      channel.addHandler(
        'isDisabledChangedForFieldLocale',
        (id: string, locale: string, isDisabled: boolean) => {
          if (id === this.id && locale === this.locale) {
            this._isDisabledSignal.dispatch(isDisabled)
          }
        }
      )
  
      channel.addHandler(
        'schemaErrorsChangedForFieldLocale',
        (id: string, locale: string, errors: ValidationError[]) => {
          if (id === this.id && locale === this.locale) {
            this._schemaErrorsChangedSignal.dispatch(errors)
          }
        }
      )
    }
  
    getValue() {
      return this._value
    }
  
    setValue(value: any) {
      this._value = value
      this._valueSignal.dispatch(value)
      return this._channel.call('setValue', this.id, this.locale, value)
    }
  
    removeValue() {
      this._value = undefined
      return this._channel.call('removeValue', this.id, this.locale)
    }
  
    setInvalid(isInvalid: boolean) {
      return this._channel.call('setInvalid', isInvalid, this.locale)
    }
  
    onValueChanged(handler: (value: any) => any) {
      return this._valueSignal.attach(handler)
    }
  
    onIsDisabledChanged(handler: (isDisabled: boolean) => any) {
      return this._isDisabledSignal.attach(handler)
    }
  
    onSchemaErrorsChanged(handler: Function) {
      return this._schemaErrorsChangedSignal.attach(handler)
    }
  }

  class Field implements EntryFieldAPI {
    private _defaultLocale: string
    private _fieldLocales: { [key: string]: FieldLocale }
    id: string
    locales: string[]
    type: string
    required: boolean
    validations: Object[]
    items?: Items
  
    constructor(channel: Channel, info: EntryFieldInfo, defaultLocale: string) {
      this.id = info.id
      this.locales = info.locales
      this.type = info.type
      this.required = info.required
      this.validations = info.validations
      this.items = info.items
  
      this._defaultLocale = defaultLocale
  
      this._fieldLocales = info.locales.reduce(
        (acc: { [key: string]: FieldLocale }, locale: string) => {
          const fieldLocale = new FieldLocale(channel, {
            id: info.id,
            type: info.type,
            required: info.required,
            validations: info.validations,
            items: info.items,
            locale,
            value: info.values[locale],
          })
  
          return { ...acc, [locale]: fieldLocale }
        },
        {}
      )
  
      this.assertHasLocale(defaultLocale)
    }
  
    getValue(locale?: string) {
      return this._getFieldLocale(locale).getValue()
    }
  
    setValue(value: any, locale?: string) {
      return this._getFieldLocale(locale).setValue(value)
    }
  
    removeValue(locale?: string) {
      return this.setValue(undefined, locale)
    }
  
    onValueChanged(locale: string | ((value: any) => void), handler?: (value: any) => void) {
      const h = handler || locale
      if (!handler) {
        locale = ''
      }
      return this._getFieldLocale(locale as string).onValueChanged(h as any)
    }
  
    onIsDisabledChanged(
      locale: string | ((isDisabled: boolean) => void),
      handler?: (isDisabled: boolean) => void
    ) {
      const h = handler || locale
      if (!handler) {
        locale = ''
      }
  
      return this._getFieldLocale(locale as string).onIsDisabledChanged(h as any)
    }
  
    private _getFieldLocale(locale?: string) {
      locale = locale || this._defaultLocale
      this.assertHasLocale(locale)
      return this._fieldLocales[locale]
    }
  
    getForLocale(locale: string) {
      if (!locale) {
        throw new Error('getForLocale must be passed a locale')
      }
  
      return this._getFieldLocale(locale)
    }
  
    assertHasLocale(locale: string) {
      if (!this._fieldLocales[locale]) {
        throw new Error(`Unknown locale "${locale}" for field "${this.id}"`)
      }
    }
  }
  return [MemoizedSignal, Field, FieldLocale] as const;
}
function getFieldClasses(signalClass: typeof Signal) {
  if (!fieldClassesCache) {
    fieldClassesCache = createFieldClasses(signalClass);
  }
  return fieldClassesCache;
}

function getSignalClassFromChannel(channel: Channel) {
  const messageHandlers = (channel as unknown as {
    _messageHandlers?: { [method: string]: Signal }
  })._messageHandlers;
  if (messageHandlers == null) {
    throw new Error('Could not find message handlers on channel, private schema may have changed!!!');
  }
  const handler = Object.values(messageHandlers)[0];
  if(handler == null) {
    throw new Error('Could not find message handler on channel');
  }
  const HandlerConstructor = handler.constructor as typeof Signal;
  return HandlerConstructor;
}

const taskMethods: readonly (keyof TaskAPI)[] = [
  'getTask',
  'getTasks',
  'createTask',
  'updateTask',
  'deleteTask',
];

export class CustomSDK {

  private MemoizedSignal: ReturnType<typeof getFieldClasses>[0];
  private Field: ReturnType<typeof getFieldClasses>[1];
  private FieldLocale: ReturnType<typeof getFieldClasses>[2];

  constructor(private channel: Channel, params: ConnectMessage ) {
    [this.MemoizedSignal, this.Field, this.FieldLocale] = getFieldClasses(getSignalClassFromChannel(channel));
    console.log(this.Field, this.FieldLocale);
  }

  getEntryField(info: EntryFieldInfo, defaultLocale: string): EntryFieldAPI {
    return new this.Field(this.channel, info, defaultLocale)
  }

  getField(info: FieldInfo): FieldAPI {
    return new this.FieldLocale(this.channel, info)
  }

  createEntry(
    entryData: any,
    fieldInfo: EntryFieldInfo[],
    createEntryField: Function
  ): EntryAPI {
    const channel = this.channel;
    let sys = entryData.sys
    const sysChanged = new this.MemoizedSignal(sys)
    let metadata = entryData.metadata
    const metadataChanged = new this.MemoizedSignal(metadata)
  
    this.channel.addHandler('sysChanged', (_sys: any) => {
      sys = _sys
      sysChanged.dispatch(sys)
    })
  
    this.channel.addHandler('metadataChanged', (_metadata: Metadata) => {
      metadata = _metadata
      metadataChanged.dispatch(metadata)
    })
  
    const taskApi = {} as TaskAPI
  
    taskMethods.forEach((methodName) => {
      taskApi[methodName] = function (...args: any[]) {
        return channel.call('callEntryMethod', methodName, args)
      } as any
    })
  
    return {
      getSys() {
        return sys
      },
      publish(options?: { skipUiValidation?: boolean }) {
        return channel.call<void>('callEntryMethod', 'publish', [options])
      },
      unpublish() {
        return channel.call<void>('callEntryMethod', 'unpublish')
      },
      save() {
        return channel.call<void>('callEntryMethod', 'save')
      },
      onSysChanged(handler: Function) {
        return sysChanged.attach(handler)
      },
      fields: fieldInfo.reduce((acc: any, info: EntryFieldInfo) => {
        acc[info.id] = createEntryField(info)
        return acc
      }, {}),
      ...(metadata ? { metadata } : {}),
      getMetadata() {
        return metadata
      },
      onMetadataChanged(handler: VoidFunction) {
        return metadataChanged.attach(handler)
      },
      ...taskApi,
    }
  }

  createEditor(
    editorInterface: EditorInterface
  ): SharedEditorSDK['editor'] {
    const _localeSettingsSygnal = new this.MemoizedSignal(undefined)
    const _showDisabledFieldsSygnal = new this.MemoizedSignal(undefined)
  
    this.channel.addHandler('localeSettingsChanged', (settings: EditorLocaleSettings) => {
      _localeSettingsSygnal.dispatch(settings)
    })
  
    this.channel.addHandler('showDisabledFieldsChanged', (showDisabledFields: boolean) => {
      _showDisabledFieldsSygnal.dispatch(showDisabledFields)
    })
  
    return {
      editorInterface,
      onLocaleSettingsChanged: (handler: Function) => {
        return _localeSettingsSygnal.attach(handler)
      },
      onShowDisabledFieldsChanged: (handler: Function) => {
        return _showDisabledFieldsSygnal.attach(handler)
      },
    }
  }
}

/**
 * A react hook returning the Custom SDK.
 */
export default function useCustomSDK() {
  const { sdk, customSdk } = useContext(CustomSDKContext);

  if (!sdk) {
    throw new Error('SDKContext not found. Make sure this hook is used inside the SDKProvider');
  }

  if (!customSdk) {
    throw new Error('CustomSDKContext not found. Make sure this hook is used inside the CustomSDKProvider');
  }

  return customSdk;
}