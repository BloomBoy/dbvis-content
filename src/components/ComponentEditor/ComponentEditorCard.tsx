import { DeleteIcon } from '@contentful/f36-icons';
import React, { useCallback, useMemo, useRef } from 'react';

import components, {
  ComponentDataByTypeName,
  ComponentDef,
  ComponentTypeName,
  FullComponentProps,
  StoredComponentData,
} from '../../ComponentTypeDefinitions';
import {
  Stack,
  Text,
  EntryCard,
  IconButton,
  MenuItem,
  IconProps,
  IconVariant,
} from '@contentful/f36-components';
import DefaultComponentEditor from './DefaultComponentEditor';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { MissingEntityCard } from '@contentful/field-editor-reference';

export type ComponentEditorProps<ComponentName extends ComponentTypeName> = {
  item: StoredComponentData<
    ComponentDataByTypeName<ComponentName>,
    ComponentName
  >;
  id: string;
  index: number;
  isDisabled: boolean;
  setValue: (
    newValue: StoredComponentData<
      ComponentDataByTypeName<ComponentName>,
      ComponentName
    >,
  ) => Promise<unknown>;
  onRemove(): Promise<unknown>;
  renderDragHandle?(props: {
    drag: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  }): JSX.Element;
  sdk: FieldExtensionSDK;
};

function getComponentDefinition<Key extends ComponentTypeName>(key: Key) {
  return components[key] as unknown as
    | ComponentDef<ComponentDataByTypeName<Key>, Key>
    | undefined;
}

function Editor<T extends ComponentTypeName>(
  props: FullComponentProps<ComponentDataByTypeName<T>, T> & {
    handleOnRemove(): void;
  },
) {
  const { handleOnRemove, ...childProps } = props;

  const propsRef = useRef(props);
  propsRef.current = props;

  const ComponentEditor =
    childProps.definition.renderEditor == null ||
    childProps.definition.renderEditor === true
      ? DefaultComponentEditor
      : childProps.definition.renderEditor;

  const [actions, renderMenu] = useMemo(() => {
    const arr: {
      label: string;
      key: string;
      icon?: React.ComponentType<IconProps>;
      iconVariant?: IconVariant;
      activate: () => void;
      quickAccess?: boolean;
    }[] = [];
    arr.push({
      label: 'Delete',
      key: 'delete',
      icon: DeleteIcon,
      iconVariant: 'negative',
      activate: handleOnRemove,
      quickAccess: arr.length === 0,
    });
    return [arr, arr.some((a) => !a.quickAccess)];
  }, [handleOnRemove]);

  return (
    <EntryCard
      contentType={childProps.definition.name || childProps.type}
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
      dragHandleRender={childProps.renderDragHandle}
      withDragHandle={!!childProps.renderDragHandle}
    >
      {ComponentEditor && <ComponentEditor {...childProps} />}
    </EntryCard>
  );
}

export default function ComponentEditorCard<T extends ComponentTypeName>(
  props: ComponentEditorProps<T>,
) {
  const { item, id, index, renderDragHandle, sdk, setValue } = props;

  const propsRef = useRef(props);
  propsRef.current = props;

  const removeValue = useCallback(async () => {
    await propsRef.current.onRemove();
    return undefined;
  }, []);
  const component = getComponentDefinition(item.type);

  const childProps:
    | FullComponentProps<ComponentDataByTypeName<T>, T>
    | (Omit<FullComponentProps<ComponentDataByTypeName<T>, T>, 'definition'> & {
        definition: undefined;
      }) = {
    ...item,
    baseId: id,
    sdk,
    setValue,
    removeValue,
    index,
    definition: component,
    renderDragHandle: renderDragHandle,
  };

  const childPropsRef = useRef(childProps);
  childPropsRef.current = childProps;

  const handleOnRemove = useCallback(() => {
    const fullProps =
      childPropsRef.current.definition != null ? childPropsRef.current : null;
    const componentName = component?.name || item.type;
    let title: string | null = null;
    if (typeof fullProps?.definition?.title === 'string') {
      title =
        (item.data[fullProps?.definition?.title] != null &&
          String(item.data[fullProps?.definition?.title])) ||
        null;
    } else if (typeof fullProps?.definition?.title === 'function') {
      title = fullProps?.definition?.title(fullProps) || null;
    }
    sdk.dialogs
      .openConfirm({
        message: `This will delete the ${componentName} component${
          title ? ` '${title}'` : ''
        }`,
        intent: 'negative',
        confirmLabel: `Delete ${componentName} component`,
        title: `Delete ${componentName} component?`,
      })
      .then((shouldRemove) => {
        if (shouldRemove) {
          removeValue();
        }
      });
  }, [component, sdk.dialogs, item.type, item.data, removeValue]);

  if (childProps.definition == null) {
    return (
      <MissingEntityCard
        entityType="Entry"
        onRemove={handleOnRemove}
        isDisabled={props.isDisabled}
      />
    );
  }
  return <Editor {...childProps} handleOnRemove={handleOnRemove} />;
}
