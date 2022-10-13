import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Paragraph,
  Stack,
} from '@contentful/f36-components';
import {
  ContentTypeAPI,
  DialogExtensionSDK,
  EntryFieldInfo,
  FieldExtensionSDK,
  IdsAPI,
  SerializedJSONValue,
} from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import useCustomSDK from '../hooks/useCustomSdk';
import {
  AppProps,
  FullLayoutProps,
  LayoutContainerDataByTypeName,
  LayoutDataByTypeName,
  layouts,
  LayoutTypeDef,
  LayoutTypeDefByTypeName,
  LayoutTypeName,
  StoredLayoutData,
  StoredLayoutDataByTypeName,
  StoredLayoutEntity,
} from '../LayoutTypeDefinitions';
import { DefaultModal } from '../components/LayoutEditor';
import { fromEntries } from '../utils/objects';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import throttle from 'lodash/throttle';

type OptionalIds = Exclude<keyof IdsAPI, keyof DialogExtensionSDK['ids']>;

type Ids = DialogExtensionSDK['ids'] & {
  [key in OptionalIds]?: IdsAPI[key];
};

type PageLayoutEditorDialogueProps = {
  sdk: DialogExtensionSDK;
  locale: string;
  layout: string;
};

type FullPageProps<LayotType extends LayoutTypeName> = {
  [key in LayoutTypeName]: {
    layoutDefinition: LayoutTypeDef<
      LayoutDataByTypeName<key>,
      LayoutContainerDataByTypeName<key>,
      key
    >;
    layout: StoredLayoutData<
      LayoutDataByTypeName<key>,
      LayoutContainerDataByTypeName<key>,
      key
    >;
  };
}[LayoutTypeName] & {
  sdk: FieldExtensionSDK;
  layoutIndex: number;
  layouts: StoredLayoutEntity[];
  setValue: (
    newVal: StoredLayoutEntity[],
  ) => Promise<SerializedJSONValue | undefined>;
  onRemove: () => Promise<unknown>;
};

const styles = {
  editorWrapper: css({
    height: '100vh',
    overflow: 'hidden',
  }),
  editorHeader: css({
    width: '100%',
    backgroundColor: tokens.colorWhite,
    borderBottom: `1px solid ${tokens.gray200}`,
    flexShrink: 0,
  }),
  editorBody: css({
    width: '100%',
    flexGrow: 1,
    overflow: 'auto',
  }),
};

function RenderFullPage<LayoutType extends LayoutTypeName>(
  props: FullPageProps<LayoutType>,
) {
  const { sdk, layout, layoutDefinition, onRemove, layoutIndex } = props;
  const dialogueSdk = useSDK<DialogExtensionSDK>();
  const propsRef = useRef(props);
  const [headerRef, setHeaderRef] = useState<HTMLDivElement | null>(null);
  const [bodyRef, setBodyRef] = useState<HTMLDivElement | null>(null);
  propsRef.current = props;

  useEffect(() => {
    if (!headerRef || !bodyRef) return;
    const recalculateHeight = throttle(() => {
      const height = headerRef.clientHeight + bodyRef.clientHeight + 1;
      sdk.window.updateHeight(height);
    }, 500);
    recalculateHeight();
    window.addEventListener('resize', recalculateHeight);

    const headerObserver = new MutationObserver(recalculateHeight);
    headerObserver.observe(headerRef, { childList: true, subtree: true });
  
    const bodyObserver = new MutationObserver(recalculateHeight);
    bodyObserver.observe(bodyRef, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', recalculateHeight);
      headerObserver.disconnect();
      bodyObserver.disconnect();
    };
  }, [headerRef, bodyRef, sdk.window]);

  const RenderModal = (
    layoutDefinition.renderModal == null ||
    layoutDefinition.renderModal === true
      ? DefaultModal
      : layoutDefinition.renderModal
  ) as
    | React.ComponentType<
        FullLayoutProps<
          LayoutDataByTypeName<LayoutType>,
          LayoutContainerDataByTypeName<LayoutType>,
          LayoutType
        >
      >
    | false;

  const wrappedSetValue = useCallback(
    (newVal: StoredLayoutDataByTypeName<LayoutType>) => {
      const { layouts, setValue, layoutIndex } = propsRef.current;
      const newLayouts = [...layouts];
      newLayouts[layoutIndex] = newVal;
      return setValue(newLayouts);
    },
    [],
  );

  const removeValue = useCallback(async () => {
    await onRemove();
    return undefined;
  }, [onRemove]);

  const save = useCallback(() => {
    dialogueSdk.close(layout);
  }, [dialogueSdk, layout]);

  const close = useCallback(() => {
    dialogueSdk.close();
  }, [dialogueSdk]);

  if (!RenderModal) {
    return <Paragraph>This layout type cannot be edited</Paragraph>;
  }

  const appProps: AppProps<
    LayoutDataByTypeName<LayoutType>,
    LayoutContainerDataByTypeName<LayoutType>,
    LayoutType
  > = {
    setValue: wrappedSetValue,
    sdk,
    index: layoutIndex,
    definition: layoutDefinition as LayoutTypeDef<
      LayoutDataByTypeName<LayoutType>,
      LayoutContainerDataByTypeName<LayoutType>,
      LayoutType
    >,
    removeValue,
  };

  const fullLayoutProps: FullLayoutProps<
    LayoutDataByTypeName<LayoutType>,
    LayoutContainerDataByTypeName<LayoutType>,
    LayoutType
  > = {
    ...(layout as StoredLayoutData<
      LayoutDataByTypeName<LayoutType>,
      LayoutContainerDataByTypeName<LayoutType>,
      LayoutType
    >),
    ...appProps,
  };

  let title: string;
  if (layoutDefinition.title == null) {
    title = '';
  } else if (typeof layoutDefinition.title === 'function') {
    title = layoutDefinition.title(layout as any) || '';
  } else {
    title =
      ((layout.data as Record<string, unknown>)[layoutDefinition.title] !=
        null &&
        String(
          (layout.data as Record<string, unknown>)[layoutDefinition.title],
        )) ||
      '';
  }
  title = title || `${layoutDefinition.name || layout.type}(${layout.id})`;

  return (
    <Stack flexDirection="column" className={styles.editorWrapper} spacing="none">
      <Stack
        className={styles.editorHeader}
        alignItems="center"
        justifyContent="space-between"
        padding="spacingS"
        ref={setHeaderRef}
      >
        <Heading as="h2" marginBottom="none">
          {title}
        </Heading>
        <Stack>
          <Button variant="negative" onClick={close}>
            Discard changes
          </Button>
          <Button variant="primary" onClick={save}>
            Done
          </Button>
        </Stack>
      </Stack>
      <Box className={styles.editorBody}>
        <Box ref={setBodyRef}>
          <RenderModal {...fullLayoutProps} />
        </Box>
      </Box>
    </Stack>
  );
}

function PageLayoutEditorDialogue({
  sdk,
  layout: layoutId,
}: Omit<PageLayoutEditorDialogueProps, 'sdk'> & {
  sdk: FieldExtensionSDK;
}) {
  const dialogueSdk = useSDK<DialogExtensionSDK>();
  const dialogueSdkRef = useRef(dialogueSdk);
  dialogueSdkRef.current = dialogueSdk;

  const [fieldValue, setFieldValue] = useState<StoredLayoutEntity[]>(
    sdk.field.getValue() ?? [],
  );

  useEffect(() => {
    return sdk.field.onValueChanged(setFieldValue);
  }, [sdk.field]);

  const fieldvalueRef = useRef(fieldValue);
  fieldvalueRef.current = fieldValue;

  const layoutIndex =
    fieldValue.findIndex((layout) => layout.id === layoutId) ?? -1;
  const layoutIndexRef = useRef(layoutIndex);
  layoutIndexRef.current = layoutIndex;
  const layout = fieldValue[layoutIndex] as StoredLayoutEntity | undefined;

  console.log({
    layoutIndex,
    layout,
    layoutId,
  });

  const setValue = useCallback((newVal: StoredLayoutEntity[]) => {
    console.log({ newVal });
    setFieldValue(newVal);
    return Promise.resolve(newVal as unknown as SerializedJSONValue);
  }, []);

  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const handleOnRemove = useCallback(() => {
    if (layoutRef.current == null) return Promise.resolve(undefined);
    const layoutDef = layouts[
      layoutRef.current.type
    ] as LayoutTypeDefByTypeName<typeof layoutRef.current.type>;
    let title: string;
    if (layoutDef.title == null) {
      title = '';
    } else if (typeof layoutDef.title === 'function') {
      title = layoutDef.title(layoutRef.current as any) || '';
    } else {
      title =
        ((layoutRef.current.data as Record<string, unknown>)[layoutDef.title] !=
          null &&
          String(
            (layoutRef.current.data as Record<string, unknown>)[
              layoutDef.title
            ],
          )) ||
        '';
    }
    title =
      title ||
      `${layoutDef.name || layoutRef.current.type}(${layoutRef.current.id})`;
    return dialogueSdkRef.current.dialogs
      .openConfirm({
        message: `This will delete the layout '${title}' and any configuration and any components defined within. Reusable components are defined elsewhere and only imported. They will still be available to other layouts.`,
        intent: 'negative',
        confirmLabel: 'Delete layout',
        title: 'Delete layout?',
      })
      .then((shouldRemove) => {
        if (shouldRemove) {
          dialogueSdkRef.current.close('DELETE');
        }
        return undefined;
      });
  }, []);

  if (layout == null) {
    return <Paragraph>Unable to load field</Paragraph>;
  }

  const childLayoutProps = {
    layoutDefinition: layouts[layout.type],
    layout,
  } as {
    [key in LayoutTypeName]: {
      layoutDefinition: LayoutTypeDef<
        LayoutDataByTypeName<key>,
        LayoutContainerDataByTypeName<key>,
        key
      >;
      layout: StoredLayoutData<
        LayoutDataByTypeName<key>,
        LayoutContainerDataByTypeName<key>,
        key
      >;
    };
  }[LayoutTypeName];

  const childProps = {
    ...childLayoutProps,
    layouts: fieldValue,
    sdk,
    setValue,
    layoutIndex,
    onRemove: handleOnRemove,
  };

  return <RenderFullPage {...childProps} />;
}

function PageLayoutEditorDialogueLoader(props: PageLayoutEditorDialogueProps) {
  const { sdk, locale } = props;
  const cma = useCMA();
  const customSdk = useCustomSDK();

  const sdkIds: Ids = sdk.ids;

  const [error, setError] = useState<Error | null>(null);

  const {
    space: spaceId,
    environment: environmentId,
    contentType: contentTypeId,
    entry: entryId,
    field: fieldId,
  } = sdkIds;

  const [recoveredFieldSDK, setRecoveredFieldSDK] =
    useState<FieldExtensionSDK>();

  useEffect(() => {
    if (contentTypeId == null || entryId == null || fieldId == null) {
      setError(new Error('Missing required parameters'));
      return;
    }
    setError(null);
    let mounted = true;
    Promise.all([
      cma.entry.get<{
        [key in typeof fieldId]: {
          [key in typeof locale]?: StoredLayoutEntity[];
        };
      }>({
        entryId,
      }),
      cma.contentType
        .get({
          spaceId,
          environmentId,
          contentTypeId,
        })
        .then((contentType) => {
          return contentType;
        }),
      cma.editorInterface.get({
        spaceId: spaceId,
        environmentId: environmentId,
        contentTypeId: contentTypeId,
      }),
    ]).then(([entry, contentType, editorInterface]) => {
      if (!mounted) return;
      const layout = entry.fields[fieldId][locale];
      const fieldInfo = contentType.fields.find(
        (field) => field.id === fieldId,
      );
      if (fieldInfo == null) return null;
      const fieldDef = {
        id: fieldInfo.id,
        locale,
        type: fieldInfo.type,
        validations: fieldInfo.validations ?? [],
        required: fieldInfo.required,
      };
      if (fieldDef == null) {
        setError(
          new Error(
            `Field '${fieldId}' not found on content type '${contentTypeId}'`,
          ),
        );
        return;
      }
      const field = customSdk.getField({
        ...fieldDef,
        value: layout ?? [],
      });
      const entryFieldInfo = contentType.fields.map((field): EntryFieldInfo => {
        const fieldVal = entry.fields[field.id];
        const locales =
          fieldVal != null ? Object.keys(fieldVal) : [sdk.locales.default];
        const values = fromEntries(
          locales.map((locale) => [locale, fieldVal?.[locale]] as const),
        );
        return {
          id: field.id,
          type: field.type,
          validations: field.validations ?? [],
          required: field.required,
          locales,
          values,
          ...(field.items != null ? { items: field.items } : null),
        };
      });
      setRecoveredFieldSDK({
        access: sdk.access,
        cmaAdapter: sdk.cmaAdapter,
        contentType: contentType as unknown as ContentTypeAPI,
        entry: customSdk.createEntry(
          {
            metadata: entry.metadata,
            sys: entry.sys,
          },
          entryFieldInfo,
          (info: EntryFieldInfo) =>
            customSdk.getEntryField(info, sdk.locales.default),
        ),
        dialogs: sdk.dialogs,
        field,
        ids: {
          ...sdkIds,
          field: fieldId,
          entry: entryId,
          contentType: contentTypeId,
        },
        space: sdk.space,
        user: sdk.user,
        locales: sdk.locales,
        navigator: sdk.navigator,
        notifier: sdk.notifier,
        parameters: sdk.parameters,
        location: sdk.location,
        editor: customSdk.createEditor(editorInterface),
        window: sdk.window,
      });
    });
    return () => {
      mounted = false;
      setRecoveredFieldSDK(undefined);
      setError(null);
    };
  }, [
    cma.contentType,
    cma.editorInterface,
    cma.entry,
    contentTypeId,
    customSdk,
    entryId,
    environmentId,
    fieldId,
    locale,
    sdk.access,
    sdk.cmaAdapter,
    sdk.dialogs,
    sdk.locales,
    sdk.location,
    sdk.navigator,
    sdk.notifier,
    sdk.parameters,
    sdk.space,
    sdk.user,
    sdk.window,
    sdkIds,
    spaceId,
  ]);

  if (error != null) {
    return <Paragraph>{error.message}</Paragraph>;
  }

  if (recoveredFieldSDK == null) {
    return <Paragraph>Loading...</Paragraph>;
  }

  return <PageLayoutEditorDialogue {...props} sdk={recoveredFieldSDK} />;
}

const dialogues = {
  layoutEditor: PageLayoutEditorDialogueLoader,
};

type PageDialogueInvokationMap = {
  [key in keyof typeof dialogues]: Omit<
    Parameters<typeof dialogues[key]>[0],
    'sdk'
  > & { type: key };
};

function isInvocation(
  invocation: SerializedJSONValue | undefined,
): invocation is PageDialogueInvokationMap[keyof PageDialogueInvokationMap] {
  return (
    typeof invocation === 'object' &&
    invocation !== null &&
    'type' in invocation &&
    typeof invocation.type === 'string' &&
    invocation.type in dialogues
  );
}

const Dialog = () => {
  const sdk = useSDK<DialogExtensionSDK>();

  const invocation = sdk.parameters.invocation;

  if (isInvocation(invocation)) {
    const { type, ...props } = invocation;
    const Dialogue = dialogues[type];
    return <Dialogue sdk={sdk} {...props} />;
  }

  // const fieldEditor = useFieldEditor(field);
  return <Paragraph>Hello Dialog Component (AppId: {sdk.ids.app})</Paragraph>;
};

export default Dialog;
