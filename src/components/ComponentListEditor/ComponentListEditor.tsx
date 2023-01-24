import components, {
  ComponentDataByTypeName,
  ComponentLink,
  ComponentTypeName,
  isComponentLink,
  StoredComponentData,
  StoredComponentDataByTypeName,
  StoredComponentEntity,
} from '../../ComponentTypeDefinitions';
import {
  ComponentContainer,
  FullLayoutProps,
  LayoutContainerDataByTypeName,
  LayoutDataByTypeName,
  LayoutTypeName,
} from '../../LayoutTypeDefinitions';
import ComponentEditorCard from '../ComponentEditor/ComponentEditorCard';
import SortableList, { SortableContainerChildProps } from '../SortableList';
import ComponentAction from './ComponentActions';
import * as definitionHelpers from '../../utils/definitionHelpers';
import { useCallback, useMemo, useRef } from 'react';
import { pathToString } from '../../utils/deepValue';
import { FieldMap } from '../../shared';
import { FetchingWrappedEntryCard } from '../FetchingWrappedEntryCard';
import useAllContentTypes from '../../hooks/useAllContentTypes';

type Props<LayoutType extends LayoutTypeName> = FullLayoutProps<
  LayoutDataByTypeName<LayoutType>,
  LayoutContainerDataByTypeName<LayoutType>,
  LayoutType
> & {
  slotIndex: number;
  slot: ComponentContainer<LayoutContainerDataByTypeName<LayoutType>>;
  disabled?: boolean;
};

function onLinkOrCreate(
  setValue: (
    value: (StoredComponentEntity | ComponentLink<string>)[],
  ) => Promise<unknown>,
  items: (StoredComponentEntity | ComponentLink<string>)[],
  types: (ComponentTypeName | ComponentLink<string>)[],
  index = items.length,
): Promise<unknown> {
  const id = definitionHelpers.getId();
  const newLayouts = types.map((type) => {
    if (typeof type === 'object') {
      return type;
    }
    const component = components[type];
    return {
      type,
      id,
      data: definitionHelpers.getDefaultFieldMap(
        component.subFields as FieldMap<ComponentDataByTypeName<typeof type>>,
      ),
    };
  });
  const newItems = Array.from(items);
  newItems.splice(index, 0, ...newLayouts);
  return setValue(newItems);
}

export default function ComponentListEditor<LayoutType extends LayoutTypeName>(
  props: Props<LayoutType>,
) {
  const { slot, sdk, disabled = false } = props;
  const allContentTypes = useAllContentTypes(sdk);
  const value = slot.components;

  const propsRef = useRef(props);
  propsRef.current = props;

  const wrappedSetValue = useCallback(
    (newValue: (StoredComponentEntity | ComponentLink<string>)[]) => {
      const newSlots = Array.from(propsRef.current.slots);
      newSlots[propsRef.current.slotIndex] = {
        ...newSlots[propsRef.current.slotIndex],
        components: newValue,
      };
      return propsRef.current.setValue({
        data: propsRef.current.data,
        id: propsRef.current.id,
        slots: newSlots,
        type: propsRef.current.type,
      });
    },
    [],
  );

  const onCreate = useCallback(
    (type: ComponentTypeName, index?: number) => {
      const value =
        propsRef.current.slots[propsRef.current.slotIndex].components;
      if (value) {
        return onLinkOrCreate(wrappedSetValue, value, [type], index);
      }
      return Promise.resolve(undefined);
    },
    [wrappedSetValue],
  );

  const replaceComponent = useMemo(() => {
    let index = -1;
    return (
      oldId: string,
      newValue: StoredComponentEntity | ComponentLink<string>,
    ) => {
      const newComponents = Array.from(propsRef.current.slot.components);
      if (index >= newComponents.length || index < 0 || newComponents[index].id !== oldId) {
        index = newComponents.findIndex((c) => c.id === oldId);
      }
      if (index !== -1) {
        newComponents[index] = newValue;
        return wrappedSetValue(newComponents);
      }
      newComponents.push(newValue);
      return wrappedSetValue(newComponents);
    };
  }, [wrappedSetValue]);

  const baseIid = useMemo(() => {
    return pathToString([
      { index: propsRef.current.index, id: propsRef.current.id },
      'slots',
      { index: propsRef.current.slotIndex, id: propsRef.current.slot.id },
      'components',
    ]);
  }, []);

  const oldMappedItems = useRef<
    | (
        | {
            item: StoredComponentEntity;
            id: string;
            type: 'component';
            setter<Key extends ComponentTypeName>(
              newEntity: StoredComponentData<ComponentDataByTypeName<Key>, Key>,
            ): Promise<unknown>;
          }
        | {
            item: ComponentLink<string>;
            id: string;
            type: 'link';
          }
      )[]
    | null
  >(null);
  const mappedItems = useMemo(() => {
    const val = value.map((component, index) => {
      if (oldMappedItems.current?.[index]?.item === component) {
        return oldMappedItems.current[index];
      }
      if (isComponentLink(component)) {
        return {
          item: component,
          id: component.id,
          type: 'link' as const,
        };
      }
      return {
        item: component,
        id: component.id,
        type: 'component' as const,
        setter<Key extends ComponentTypeName>(
          newEntity: StoredComponentData<ComponentDataByTypeName<Key>, Key>,
        ) {
          return replaceComponent(component.id, newEntity as StoredComponentEntity);
        },
      };
    });
    oldMappedItems.current = val;
    return val;
  }, [value, replaceComponent]);

  const setListValue = useCallback(
    (newValue: typeof mappedItems) => {
      return wrappedSetValue(newValue.map(({ item }) => item));
    },
    [wrappedSetValue],
  );

  return (
    <SortableList
      items={mappedItems}
      isDisabled={disabled}
      setValue={setListValue}
      action={
        <ComponentAction
          addNewComponent={onCreate}
          isFull={false}
          isEmpty={value.length === 0}
        />
      }
    >
      {<ComponentType extends ComponentTypeName>({
        item,
        index,
        isDisabled,
        DragHandle,
      }: SortableContainerChildProps<
        | {
            item: StoredComponentDataByTypeName<ComponentType>;
            setter<Key extends ComponentTypeName>(
              newEntity: StoredComponentData<ComponentDataByTypeName<Key>, Key>,
            ): Promise<unknown>;
            id: string;
            type: 'component';
          }
        | {
            item: ComponentLink<string>;
            id: string;
            type: 'link';
          }
      >) => {
        if (item.type === 'link') {
          return (
            <FetchingWrappedEntryCard
              key={`${item.item.sys.id}-${item.id}`}
              isInitiallyDisabled={false}
              hasCardEditActions={false}
              sdk={sdk}
              viewType={'link'}
              parameters={{
                instance: {
                  showCreateEntityAction: false,
                  showLinkEntityAction: true,
                  bulkEditing: false,
                },
              }}
              renderDragHandle={DragHandle}
              entryId={item.item.sys.id}
              allContentTypes={allContentTypes}
              isDisabled={isDisabled}
              onRemove={() =>
                wrappedSetValue(value.filter(({ id }) => id !== item.id)).then(
                  () => {
                    sdk.entry.save();
                  },
                )
              }
            />
          );
        } else {
          return (
            <ComponentEditorCard
              isDisabled={isDisabled}
              item={item.item}
              setValue={item.setter}
              id={pathToString([baseIid, { index, id: item.id }])}
              sdk={sdk}
              index={index}
              key={`${item.type}-${item.id}`}
              onRemove={() =>
                wrappedSetValue(value.filter((_value, i) => i !== index))
              }
              renderDragHandle={DragHandle}
            />
          );
        }
      }}
    </SortableList>
  );
}
