import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import LayoutActions from './LayoutActions';
import {
  layouts,
  LayoutTypeName,
  LAYOUT_TYPES,
  StoredLayoutDataByTypeName,
  StoredLayoutEntity,
} from '../../LayoutTypeDefinitions';
import * as definitionHelpers from '../../utils/definitionHelpers';
import { LayoutEditorCard } from '../LayoutEditor';
import SortableList, { SortableContainerChildProps } from '../SortableList';


function onLinkOrCreate(
  setValue: (value: StoredLayoutEntity[]) => Promise<unknown>,
  items: StoredLayoutEntity[],
  types: LayoutTypeName[],
  index = items.length,
): Promise<unknown> {
  const id = definitionHelpers.getId();
  const newLayouts: StoredLayoutEntity[] = types.map((type) => {
    const layout = layouts[type];
    const configurableSlotCount =
      definitionHelpers.resolveConfigurableSlotCount(
        layout.configurableSlotCount,
      );
    const slots = layout.defaultSlots ?? [];
    if (configurableSlotCount !== false) {
      for (let i = slots.length; i < configurableSlotCount[0]; i++) {
        slots.push(definitionHelpers.createSlot(layout));
      }
    }
    return {
      type,
      id,
      slots,
      data: definitionHelpers.getDefaultFieldMap(layout.subFields),
    };
  });
  const newItems = Array.from(items);
  newItems.splice(index, 0, ...newLayouts);
  return setValue(newItems);
}

const emptyArray: never[] = [];

export default function LayoutListEditor() {
  const sdk = useSDK<FieldExtensionSDK>();
  const fieldRef = useRef(sdk.field);
  fieldRef.current = sdk.field;
  const [isDisabled, setIsDisabled] = useState(false);
  const [currentValue, setCurrentValue] = useState(
    fieldRef.current.getValue() as StoredLayoutEntity[] | undefined,
  );

  useEffect(() => {
    const unlistenOnValue = sdk.field.onValueChanged((value) => {
      setCurrentValue(value as StoredLayoutEntity[] | undefined);
    });
    const unlistenOnIsDisabled = sdk.field.onIsDisabledChanged((isDisabled) => {
      setIsDisabled(isDisabled);
    });
    return () => {
      unlistenOnValue();
      unlistenOnIsDisabled();
    }
  }, [sdk.field]);

  const setValue = useCallback((value: StoredLayoutEntity[]): Promise<unknown> => {
    return fieldRef.current.setValue(value);
  }, []);


  const value = Array.isArray(currentValue) ? currentValue : emptyArray;

  const onCreate = useCallback(
    (type: typeof LAYOUT_TYPES[number], index?: number) =>
      onLinkOrCreate(
        setValue,
        value,
        [type],
        index,
      ).then(() => {
        sdk.entry.save();
      }),
    [setValue, sdk.entry, value],
  );

  const itemsWithSetter = useMemo(() => value.map((layout, index) => {
    return {item: layout, id: layout.id, setter(newEntity: StoredLayoutEntity) {
      const newValue = [...value];
      newValue[index] = newEntity;
      return setValue(newValue);
    }};
  }), [setValue, value]);

  const setListValue = useCallback((newValue: typeof itemsWithSetter) => {
    return fieldRef.current.setValue(newValue.map(({ item }) => item));
  }, []);

  return (
    <SortableList
      items={itemsWithSetter}
      isDisabled={isDisabled}
      setValue={setListValue}
      action={
        <LayoutActions
          addNewLayout={onCreate}
          isFull={false}
          isEmpty={value.length === 0}
        />
      }
    >
      {<LayoutType extends LayoutTypeName>({
        item: {item, setter},
        index,
        isDisabled,
        DragHandle,
      }: SortableContainerChildProps<
        { item: StoredLayoutDataByTypeName<LayoutType>, setter(newEntity: StoredLayoutDataByTypeName<LayoutType>): Promise<unknown>; id: string }
      >) => (
        <LayoutEditorCard
          isDisabled={isDisabled}
          index={index}
          item={item}
          setValue={setter}
          sdk={sdk}
          key={`${item.type}-${item.id}`}
          onRemove={() =>
            setValue(value.filter(({ id }) => id !== item.id))
              .then(() => {
                sdk.entry.save();
              })
          }
          renderDragHandle={DragHandle}
        />
      )}
    </SortableList>
  );
}
