import components, {
  ComponentDataByTypeName,
  ComponentTypeName,
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
import { SerializedJSONValue } from '@contentful/app-sdk';
import { pathToString } from '../../utils/deepValue';
import { FieldMap } from '../../shared';

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
    value: StoredComponentEntity[],
  ) => Promise<unknown>,
  items: StoredComponentEntity[],
  types: ComponentTypeName[],
  index = items.length,
): Promise<unknown> {
  const id = definitionHelpers.getId();
  const newLayouts = types.map((type) => {
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
  const value = slot.components;

  const propsRef = useRef(props);
  propsRef.current = props;

  const wrappedSetValue = useCallback((newValue: StoredComponentEntity[]) => {
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
  }, []);

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

  const baseIid = useMemo(() => {
    return pathToString([
      { index: propsRef.current.index, id: propsRef.current.id },
      'slots',
      { index: propsRef.current.slotIndex, id: propsRef.current.slot.id },
      'components',
    ]);
  }, []);

  const oldItemsWithSetters = useRef<
    | {
        item: StoredComponentEntity;
        id: string;
        setter<Key extends ComponentTypeName>(
          newEntity: StoredComponentData<ComponentDataByTypeName<Key>, Key>,
        ): Promise<unknown>;
      }[]
    | null
  >(null);
  const itemsWithSetter = useMemo(() => {
    const val = value.map((layout, index) => {
      if (oldItemsWithSetters.current?.[index].item === layout) {
        return oldItemsWithSetters.current[index];
      }
      return {
        item: layout,
        id: layout.id,
        setter<Key extends ComponentTypeName>(
          newEntity: StoredComponentData<ComponentDataByTypeName<Key>, Key>,
        ) {
          const newValue = [...value];
          newValue[index] = newEntity as StoredComponentEntity;
          return wrappedSetValue(newValue);
        },
      };
    });
    oldItemsWithSetters.current = val;
    return val;
  }, [wrappedSetValue, value]);

  const setListValue = useCallback(
    (newValue: typeof itemsWithSetter) => {
      return wrappedSetValue(newValue.map(({ item }) => item));
    },
    [wrappedSetValue],
  );

  return (
    <SortableList
      items={itemsWithSetter}
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
        items,
        item: { item, setter },
        index,
        isDisabled,
        DragHandle,
      }: SortableContainerChildProps<{
        item: StoredComponentDataByTypeName<ComponentType>;
        setter<Key extends ComponentTypeName>(
          newEntity: StoredComponentData<ComponentDataByTypeName<Key>, Key>,
        ): Promise<unknown>;
        id: string;
      }>) => (
        <ComponentEditorCard
          isDisabled={isDisabled}
          item={item}
          setValue={setter}
          id={pathToString([baseIid, { index, id: item.id }])}
          sdk={sdk}
          index={index}
          key={`${item.type}-${item.id}`}
          onRemove={() =>
            wrappedSetValue(value.filter((_value, i) => i !== index))
          }
          renderDragHandle={DragHandle}
        />
      )}
    </SortableList>
  );
}
