import components, { ComponentDataByTypeName, ComponentTypeName, StoredComponentDataByTypeName, StoredComponentEntity } from "../../ComponentTypeDefinitions";
import { useSubFieldEditor } from "../../hooks/useFieldEditor";
import { FieldMap, FullLayoutProps, LayoutContainerDataByTypeName, LayoutDataByTypeName, LayoutTypeName } from "../../LayoutTypeDefinitions";
import ComponentEditorCard from "../ComponentEditor/ComponentEditorCard";
import SortableList, { SortableContainerChildProps } from "../SortableList";
import ComponentAction from "./ComponentActions";
import * as definitionHelpers from '../../utils/layoutDefinitionHelpers';
import { useCallback, useMemo, useRef } from "react";
import { SerializedJSONValue } from "@contentful/app-sdk";
import { pathToString } from "../../utils/deepValue";

type Props<LayoutType extends LayoutTypeName> = FullLayoutProps<
LayoutDataByTypeName<LayoutType>,
LayoutContainerDataByTypeName<LayoutType>,
LayoutType
> & {
  slotIndex: number;
  slotId: string;
  disabled?: boolean;
}

function onLinkOrCreate(
  setValue: (value: StoredComponentEntity[]) => Promise<SerializedJSONValue | undefined>,
  items: StoredComponentEntity[],
  types: ComponentTypeName[],
  index = items.length,
): Promise<unknown> {
  const id = definitionHelpers.getId();
  const newLayouts: StoredComponentEntity[] = types.map((type) => {
    const component = components[type];
    return {
      type,
      id,
      data: definitionHelpers.getDefaultFieldMap(component.subFields as FieldMap<ComponentDataByTypeName<typeof type>>),
    };
  });
  const newItems = Array.from(items);
  newItems.splice(index, 0, ...newLayouts);
  return setValue(newItems);
}


export default function ComponentListEditor<LayoutType extends LayoutTypeName>(props: Props<LayoutType>) {
  const {
    slots,
    slotIndex,
    sdk,
    disabled = false,
  } = props;
  const value = slots[slotIndex].components;

  const propsRef = useRef(props);
  propsRef.current = props;

  const wrappedSetImmediateValue = useCallback(
    (newValue: StoredComponentEntity[]) => {
      const newSlots = Array.from(propsRef.current.slots);
      newSlots[propsRef.current.slotIndex] = {
        ...newSlots[propsRef.current.slotIndex],
        components: newValue,
      };
      return propsRef.current.setImmediateValue({
        data: propsRef.current.data,
        id: propsRef.current.id,
        slots: newSlots,
        type: propsRef.current.type,
      });
    },
    [],
  );

  const wrappedSetValue = useCallback(
    (newValue: StoredComponentEntity[]) => {
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
      const value = propsRef.current.slots[propsRef.current.slotIndex].components;
      if (value) {
        return onLinkOrCreate(wrappedSetImmediateValue, value, [type], index);
      }
      return Promise.resolve(undefined);
    },
    [wrappedSetImmediateValue],
  );

  const baseIid = useMemo(() => {
    return pathToString([{ index: propsRef.current.index, id: propsRef.current.id }, 'slots', { index: propsRef.current.slotIndex, id: propsRef.current.slotId }, 'components']);
  }, []);

  if (value == null) return null;;
  return (
    <SortableList
      items={value}
      isDisabled={disabled}
      setValue={wrappedSetValue}
      setImmediateValue={wrappedSetImmediateValue}
      action={<ComponentAction
        addNewComponent={onCreate}
        isFull={false}
        isEmpty={value.length === 0}
      />}
    >
      {<ComponentType extends ComponentTypeName>({ items, item, index, isDisabled, DragHandle }: SortableContainerChildProps<StoredComponentDataByTypeName<ComponentType>>) => (
        <ComponentEditorCard
          isDisabled={isDisabled}
          components={items}
          item={item}
          setValue={wrappedSetValue}
          setImmediateValue={wrappedSetImmediateValue}
          id={pathToString([baseIid, {index, id: item.id}])}
          sdk={sdk}
          index={index}
          key={`${item.type}-${item.id}`}
          onRemove={() =>
            wrappedSetImmediateValue(items.filter((_value, i) => i !== index))
          }
          renderDragHandle={DragHandle}
        />
      )}
    </SortableList>
  );
}