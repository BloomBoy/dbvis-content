import {
  LayoutPropsByTypeName,
  layouts,
  LayoutTypeName,
  StoredLayoutEntity,
} from '../LayoutTypeDefinitions';
import { SettingsIcon } from '@contentful/f36-icons';
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { FieldAPI } from '@contentful/field-editor-shared';
import {
  ExtendedFieldConnectorChildProps,
  useSubFieldEditor,
} from '../../../hooks/useFieldEditor';
import {
  FieldTypeDefinition,
  FullLayoutProps,
  LayoutTypeDef,
  StoredLayoutProps,
  SubFields,
  WidgetDefinition,
} from '../makeLayout';
import {
  Stack,
  Text,
  Box,
  EntryCard,
  IconButton,
  MenuItem,
  HelpText,
  ModalConfirm,
  ModalLauncher,
  Paragraph,
  Modal,
} from '@contentful/f36-components';
import { objectEntries } from '../../../utils/objects';
import { Field, FieldWrapper } from '../../FieldEditor';
import {
  SUBFIELDAPI_CONFIG,
  useSubFieldAPI,
} from '../../../hooks/useConfigurableFieldAPI';

export type LayoutEditorProps<T extends LayoutTypeName> = {
  item: StoredLayoutProps<LayoutPropsByTypeName<T>, T>;
  isDisabled: boolean;
  onRemove(): Promise<unknown>;
  renderDragHandle?(props: {
    drag: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  }): JSX.Element;
  fieldEditor: ExtendedFieldConnectorChildProps<StoredLayoutEntity[]>;
};

function getLayoutDefinition<Key extends LayoutTypeName>(key: Key) {
  return layouts[key] as unknown as LayoutTypeDef<
    LayoutPropsByTypeName<Key>,
    Key
  >;
}

function SubField<
  LayoutType extends LayoutTypeName,
  Key extends keyof SubFields<LayoutPropsByTypeName<LayoutType>> & string,
>({
  subFieldKey,
  fieldEditor,
  subField,
  widget,
}: {
  subField: FieldTypeDefinition<LayoutPropsByTypeName<LayoutType>[Key]>;
  widget: WidgetDefinition | undefined;
  subFieldKey: Key;
  fieldEditor: ExtendedFieldConnectorChildProps<
    StoredLayoutProps<LayoutPropsByTypeName<LayoutType>, LayoutType>
  >;
}) {
  const configurableFieldAPI = useSubFieldAPI(
    fieldEditor.configurableFieldAPI,
    subFieldKey,
  );

  const id = fieldEditor.value?.id;

  const fieldAPI = useMemo<FieldAPI | null>(() => {
    if (configurableFieldAPI == null) {
      return null;
    }

    return {
      ...configurableFieldAPI,
      type: subField.type,
      validations: subField.validations ?? [],
      required: subField.required ?? false,
    };
  }, [
    configurableFieldAPI,
    subField.required,
    subField.type,
    subField.validations,
  ]);

  const key = useMemo(() => {
    if (configurableFieldAPI == null) {
      return undefined;
    }
    const fullPath = [
      id ?? '',
      ...configurableFieldAPI[SUBFIELDAPI_CONFIG].path,
      subFieldKey,
    ];
    return fullPath
      .map((segment) =>
        typeof segment === 'number' ? `[${segment}]` : `.${segment}`,
      )
      .join('')
      .replace(/^\./, '');
  }, [configurableFieldAPI, id, subFieldKey]);

  if (fieldAPI == null) return null;

  console.log('rendering subfield', subFieldKey, id);

  return (
    <FieldWrapper key={key} field={fieldAPI} name={subField.title ?? subFieldKey}>
      {widget ? (
        <Field
          key={key}
          field={fieldAPI}
          widgetId={widget.id}
          getOptions={(id, sdk) => ({
            [widget.id]:
              typeof widget.settings === 'function'
                ? widget.settings(id, sdk)
                : widget.settings,
          })}
        />
      ) : (
        <Field field={fieldAPI} />
      )}
    </FieldWrapper>
  );
}

function DefaultQuickSettings<LayoutType extends LayoutTypeName>({
  definition,
  fieldEditor,
}: FullLayoutProps<LayoutPropsByTypeName<LayoutType>, LayoutType>) {
  const subFields = useMemo(() => {
    return objectEntries(definition.subFields).map(([key, subField]) => {
      let widget: WidgetDefinition | undefined;
      let field: FieldTypeDefinition<
        LayoutPropsByTypeName<LayoutType>[typeof key]
      >;
      if (Array.isArray(subField)) {
        if (typeof subField[0] === 'string') {
          field = {
            type: subField[0],
          };
        } else {
          field = subField[0];
        }
        widget = subField[1];
      } else {
        if (typeof subField === 'string') {
          field = {
            type: subField,
          };
        } else {
          field = subField;
        }
      }
      return {
        key,
        subField: field,
        widget,
      };
    });
  }, [definition.subFields]);
  return (
    <Stack flexDirection="column" alignItems="stretch" padding="spacingS">
      {subFields.map(({ key, subField, widget }) => {
        if (subField.excludeFromQuicksettings) return null;
        return (
          <SubField
            key={key}
            subFieldKey={key}
            fieldEditor={fieldEditor}
            subField={subField}
            widget={widget}
          />
        );
      })}
    </Stack>
  );
}

function DefaultFullEditor<LayoutType extends LayoutTypeName>(
  props: FullLayoutProps<LayoutPropsByTypeName<LayoutType>, LayoutType> & {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
  },
): JSX.Element {
  return (
    <Box>
      <Text>aoeuaoeiaoei</Text>
    </Box>
  );
}

function toggle(old: boolean): boolean {
  return !old;
}

export default function LayoutEditorCard<T extends LayoutTypeName>({
  fieldEditor,
  item,
  renderDragHandle,
  onRemove,
}: LayoutEditorProps<T>) {
  const [open, setOpen] = useState(false);
  const index =
    fieldEditor.value?.findIndex((layout: unknown) => layout === item) ?? -1;
  const subFieldEditor: ExtendedFieldConnectorChildProps<typeof item> =
    useSubFieldEditor(fieldEditor, index >= 0 ? index : null);
  const layout = getLayoutDefinition(item.type);
  const childProps: FullLayoutProps<LayoutPropsByTypeName<T>, T> = {
    ...item,
    definition: layout,
    fieldEditor: subFieldEditor,
    renderDragHandle: renderDragHandle,
    onRemove,
  };

  let title: string;
  if (layout.title == null) {
    title = item.id;
  } else if (typeof layout.title === 'function') {
    title = layout.title(childProps) || item.id;
  } else {
    title = item[layout.title] != null ? String(item[layout.title]) : item.id;
  }

  const handleOnRemove = useCallback(() => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        isShown={isShown}
        intent="negative"
        confirmLabel="Delete layout"
        onCancel={() => {
          onClose(false);
        }}
        onConfirm={() => {
          onClose(true);
        }}
      >
        <Paragraph>
          This will delete the layout '{title || 'Untitled Layout'}' and any
          configuration and any components defined within.
        </Paragraph>
        <HelpText>
          Reusable components are defined elsewhere and only imported. They will
          still be available to other layouts.
        </HelpText>
      </ModalConfirm>
    )).then((shouldRemove) => {
      if (shouldRemove) {
        onRemove();
      }
    });
  }, [onRemove, title]);

  return (
    <EntryCard
      contentType={layout.name}
      icon={
        <IconButton
          onClick={() => setOpen(toggle)}
          icon={<SettingsIcon />}
          title="Open full editor"
          aria-label="Open full editor"
        ></IconButton>
      }
      actions={[
        <MenuItem key="fulleditor" onClick={() => setOpen(true)}>
          Open full editor
        </MenuItem>,
        <MenuItem key="remove" onClick={handleOnRemove}>
          Delete
        </MenuItem>,
      ]}
      dragHandleRender={renderDragHandle}
      withDragHandle={!!renderDragHandle}
    >
      <DefaultQuickSettings {...childProps} />
      <Modal onClose={() => setOpen(false)} isShown={open}>
        {() => (
          <>
            <Modal.Header title={title} onClose={() => setOpen(false)} />
            <Modal.Content>
              <DefaultFullEditor
                {...childProps}
                open={open}
                setOpen={setOpen}
              />
            </Modal.Content>
          </>
        )}
      </Modal>
    </EntryCard>
  );
}
