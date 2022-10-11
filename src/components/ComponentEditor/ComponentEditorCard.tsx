import { DeleteIcon } from '@contentful/f36-icons';
import React, { useCallback, useMemo, useRef } from 'react';

import {
  ExtendedFieldConnectorChildProps,
  useSubFieldEditor,
} from '../../hooks/useFieldEditor';
import components, {
  ComponentDataByTypeName,
  ComponentDef,
  ComponentTypeName,
  FullComponentProps,
  StoredComponentData,
  StoredComponentDataByTypeName,
  StoredComponentEntity,
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
import { FieldExtensionSDK, SerializedJSONValue } from '@contentful/app-sdk';

export type ComponentEditorProps<ComponentName extends ComponentTypeName> = {
  components: StoredComponentEntity[];
  item: StoredComponentData<
    ComponentDataByTypeName<ComponentName>,
    ComponentName
  >;
  id: string;
  index: number;
  isDisabled: boolean;
  setValue: (
    newValue: StoredComponentEntity[],
  ) => Promise<SerializedJSONValue | undefined>;
  setImmediateValue: (
    newValue: StoredComponentEntity[],
  ) => Promise<SerializedJSONValue | undefined>;
  onRemove(): Promise<unknown>;
  renderDragHandle?(props: {
    drag: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  }): JSX.Element;
  sdk: FieldExtensionSDK;
};

function getComponentDefinition<Key extends ComponentTypeName>(key: Key) {
  return components[key] as unknown as ComponentDef<
    ComponentDataByTypeName<Key>,
    Key
  >;
}

export default function ComponentEditorCard<T extends ComponentTypeName>(
  props: ComponentEditorProps<T>,
) {
  const {
    item,
    id,
    index,
    renderDragHandle,
    sdk,
  } = props;

  const propsRef = useRef(props);
  propsRef.current = props;

  const wrappedSetImmediateValue = useCallback(
    (newValue: StoredComponentDataByTypeName<T>) => {
      const newComponents = Array.from(propsRef.current.components);
      newComponents[propsRef.current.index] = newValue;
      return propsRef.current.setImmediateValue(newComponents);
    },
    [],
  );

  const wrappedSetValue = useCallback(
    (newValue: StoredComponentDataByTypeName<T>) => {
      const newComponents = Array.from(propsRef.current.components);
      newComponents[propsRef.current.index] = newValue;
      return propsRef.current.setValue(newComponents);
    },
    [],
  );

  const removeValue = useCallback(async () => {
    await propsRef.current.onRemove();
    return undefined;
  }, []);

  const component = getComponentDefinition(item.type);
  const childProps: FullComponentProps<ComponentDataByTypeName<T>, T> = {
    ...item,
    id,
    sdk,
    setImmediateValue: wrappedSetImmediateValue,
    setValue: wrappedSetValue,
    removeValue,
    index,
    definition: component,
    renderDragHandle: renderDragHandle,
  };

  let title: string | null = null;
  if (typeof component.title === 'string') {
    title =
      (item.data[component.title] != null &&
        String(item.data[component.title])) ||
      null;
  } else if (typeof component.title === 'function') {
    title = component.title(childProps) || null;
  }

  const handleOnRemove = useCallback(() => {
    sdk.dialogs
      .openConfirm({
        message: `This will delete the ${
          component.name || item.type
        } component${title != null ? ` '${title}'` : ''}`,
        intent: 'negative',
        confirmLabel: `Delete ${component.name || item.type} component`,
        title: `Delete ${component.name || item.type} component?`,
      })
      .then((shouldRemove) => {
        if (shouldRemove) {
          removeValue();
        }
      });
  }, [sdk.dialogs, component.name, item.type, title, removeValue]);

  const Editor =
    component.renderEditor == null || component.renderEditor === true
      ? DefaultComponentEditor
      : component.renderEditor;

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
      contentType={component.name || item.type}
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
      {Editor && <Editor {...childProps} />}
    </EntryCard>
  );
}
