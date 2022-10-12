import {
  LayoutContainerDataByTypeName,
  LayoutDataByTypeName,
  layouts,
  LayoutTypeDef,
  LayoutTypeName,
  StoredLayoutEntity,
} from '../../LayoutTypeDefinitions';
import { SettingsIcon, DeleteIcon } from '@contentful/f36-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  ExtendedFieldConnectorChildProps,
  useSubFieldEditor,
} from '../../hooks/useFieldEditor';
import { FullLayoutProps, StoredLayoutData } from '../../LayoutTypeDefinitions';
import {
  Stack,
  Text,
  EntryCard,
  IconButton,
  MenuItem,
  IconProps,
  IconVariant,
} from '@contentful/f36-components';
import DefaultQuickSettings from './DefaultQuickSettings';
import { FieldExtensionSDK, SerializedJSONValue } from '@contentful/app-sdk';

export type LayoutEditorProps<T extends LayoutTypeName> = {
  item: StoredLayoutData<
    LayoutDataByTypeName<T>,
    LayoutContainerDataByTypeName<T>,
    T
  >;
  isDisabled: boolean;
  index: number;
  onRemove(): Promise<unknown>;
  renderDragHandle?(props: {
    drag: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  }): JSX.Element;
  fieldEditor: ExtendedFieldConnectorChildProps<StoredLayoutEntity[]>;
  sdk: FieldExtensionSDK;
};

function getLayoutDefinition<Key extends LayoutTypeName>(key: Key) {
  return layouts[key] as unknown as LayoutTypeDef<
    LayoutDataByTypeName<Key>,
    LayoutContainerDataByTypeName<Key>,
    Key
  >;
}

export default function LayoutEditorCard<T extends LayoutTypeName>({
  fieldEditor,
  item,
  index,
  renderDragHandle,
  onRemove,
  sdk,
}: LayoutEditorProps<T>) {
  const subFieldEditor: ExtendedFieldConnectorChildProps<typeof item> =
    useSubFieldEditor(fieldEditor, { index, id: item.id });
  const layout = getLayoutDefinition(item.type);

  const subFieldRef = useRef(subFieldEditor);
  subFieldRef.current = subFieldEditor;

  const setValue = useCallback(
    async (value: typeof item) => {
      const ret = await subFieldRef.current.setValue(value);
      return ret as SerializedJSONValue | undefined;
    },
    []
  );

  const setImmediateValue = useCallback(
    async (value: typeof item) => {
      const ret = await subFieldRef.current.setImmediateValue(value);
      return ret as SerializedJSONValue | undefined;
    },
    []
  );

  const removeValue = useCallback(async () => {
    await onRemove();
    return undefined;
  }, [onRemove]);

  const childProps: FullLayoutProps<
    LayoutDataByTypeName<T>,
    LayoutContainerDataByTypeName<T>,
    T
  > = {
    ...item,
    index,
    sdk,
    definition: layout,
    setValue,
    setImmediateValue,
    removeValue,
    renderDragHandle: renderDragHandle,
  };

  let title: string;
  if (layout.title == null) {
    title = '';
  } else if (typeof layout.title === 'function') {
    title = layout.title(childProps) || '';
  } else {
    title =
      (item.data[layout.title] != null && String(item.data[layout.title])) ||
      '';
  }
  title = title || `${layout.name || item.type}(${item.id})`;

  const handleOnRemove = useCallback(() => {
    sdk.dialogs.openConfirm({
      message: `This will delete the layout '${title}' and any configuration and any components defined within. Reusable components are defined elsewhere and only imported. They will still be available to other layouts.`,
      intent: 'negative',
      confirmLabel: 'Delete layout',
      title: 'Delete layout?',
    }).then((shouldRemove) => {
      if (shouldRemove) {
        onRemove();
      }
    });
  }, [onRemove, sdk.dialogs, title]);

  const RenderQuickSettings =
    layout.renderQuickSettings == null || layout.renderQuickSettings === true
      ? DefaultQuickSettings
      : layout.renderQuickSettings;
  const hasModal = layout.renderModal !== false;

  const [actions, renderMenu] = useMemo(() => {
    const arr: {
      label: string;
      key: string;
      icon?: React.ComponentType<IconProps>;
      iconVariant?: IconVariant;
      activate: () => void;
      quickAccess?: boolean;
    }[] = [];
    if (hasModal) {
      arr.push({
        label: 'Open full editor',
        key: 'fulleditor',
        icon: SettingsIcon,
        activate: () => {
          sdk.dialogs.openCurrentApp({
            title: 'Edit layout',
            position: 'center',
            parameters: {
              type: 'layoutEditor',
              locale: sdk.field.locale,
              layout: item.id,
            },
            width: 'fullWidth',
            shouldCloseOnOverlayClick: false,
            shouldCloseOnEscapePress: false,
          }).then((value: StoredLayoutData<
            LayoutDataByTypeName<T>,
            LayoutContainerDataByTypeName<T>,
            T
          > | undefined | 'DELETE') => {
            if (value == null) {
              return;
            }
            if (value === 'DELETE') {
              onRemove();
              return;
            }
            setImmediateValue(value).then(() => {
              sdk.entry.save();
            });
          });
        },
        quickAccess: true,
      });
    }
    arr.push({
      label: 'Delete',
      key: 'delete',
      icon: DeleteIcon,
      iconVariant: 'negative',
      activate: handleOnRemove,
      quickAccess: arr.length === 0,
    });
    return [arr, arr.some((a) => !a.quickAccess)];
  }, [hasModal, handleOnRemove, sdk.dialogs, sdk.field.locale, sdk.entry, item.id, setImmediateValue, onRemove]);

  return (
    <EntryCard
      contentType={layout.name}
      icon={
        <>
          {actions
            .filter(
              (
                action,
              ): action is typeof action & {
                icon: React.ComponentType<IconProps>;
              } => action.quickAccess === true && action.icon != null,
            )
            .map((action) => (
              <IconButton
                onClick={action.activate}
                key={action.key}
                variant="transparent"
                icon={<action.icon variant={action.iconVariant} />}
                title={action.label}
                aria-label={action.label}
              />
            ))}
        </>
      }
      actions={
        renderMenu
          ? actions.map((action) => (
              <MenuItem key={action.key} onClick={action.activate}>
                {action.icon != null ? (
                  <Stack spacing="spacingXs">
                    <action.icon variant={action.iconVariant ?? 'secondary'} />
                    <Text>{action.label}</Text>
                  </Stack>
                ) : (
                  action.label
                )}
              </MenuItem>
            ))
          : undefined
      }
      dragHandleRender={renderDragHandle}
      withDragHandle={!!renderDragHandle}
    >
      {RenderQuickSettings && <RenderQuickSettings {...childProps} />}
    </EntryCard>
  );
}
