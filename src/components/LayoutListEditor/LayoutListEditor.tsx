import React, { useCallback, useMemo, useRef } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import useFieldEditor from '../../hooks/useFieldEditor';
import LayoutActions from './LayoutActions';
import {
  layouts,
  LayoutTypeName,
  LAYOUT_TYPES,
  StoredLayoutDataByTypeName,
  StoredLayoutEntity,
} from '../../LayoutTypeDefinitions';
import * as definitionHelpers from '../../utils/layoutDefinitionHelpers';
import { LayoutEditorCard } from '../LayoutEditor';
import SortableList, { SortableContainerChildProps } from '../SortableList';

type EntryLink = {
  sys: {
    type: 'Link';
    linkType: 'Entry';
    id: string;
  };
};
type AssetLink = {
  sys: {
    type: 'Link';
    linkType: 'Asset';
    id: string;
  };
};

function onLinkOrCreate(
  setValue: (value: StoredLayoutEntity[]) => Promise<unknown>,
  items: StoredLayoutEntity[],
  types: LayoutTypeName[],
  index = items.length,
): Promise<unknown> {
  const id = definitionHelpers.getId();
  const newLayouts: StoredLayoutEntity[] = types.map((type) => {
    const layout = layouts[type];
    const configurableSlotCount = definitionHelpers.resolveConfigurableSlotCount(layout.configurableSlotCount);
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
  const fieldEditor = useFieldEditor<StoredLayoutEntity[]>({
    field: sdk.field,
  });
  const assetFieldEditor = useFieldEditor<AssetLink[]>({
    field: sdk.entry.fields.pageAssets.getForLocale(sdk.field.locale) ?? null,
  });
  const referenceFieldEditor = useFieldEditor<EntryLink[]>({
    field:
      sdk.entry.fields.pageReferences.getForLocale(sdk.field.locale) ?? null,
  });

  const fieldEditorRef = useRef(fieldEditor);
  fieldEditorRef.current = fieldEditor;

  const wrappedSetValue = useCallback<typeof fieldEditor.setValue>(
    (...args) => {
      return fieldEditorRef.current.setValue(...args);
    },
    [],
  );

  const patchedFieldEditor = useMemo<typeof fieldEditor>(
    () => ({
      ...fieldEditor,
      setValue: wrappedSetValue,
    }),
    [fieldEditor, wrappedSetValue],
  );

  const { value: rawValue, setValue, disabled } = patchedFieldEditor;

  const value = Array.isArray(rawValue) ? rawValue : emptyArray;

  const onCreate = useCallback(
    (type: typeof LAYOUT_TYPES[number], index?: number) =>
      onLinkOrCreate(patchedFieldEditor.setImmediateValue, value, [type], index).then(() => {
        sdk.entry.save();
      }),
    [patchedFieldEditor.setImmediateValue, sdk.entry, value],
  );

  return (
    <SortableList
      items={value}
      isDisabled={disabled}
      setValue={setValue}
      setImmediateValue={fieldEditor.setImmediateValue}
      action={<LayoutActions
        addNewLayout={onCreate}
        isFull={false}
        isEmpty={value.length === 0}
      />}
    >
      {<LayoutType extends LayoutTypeName>({ items, item, index, isDisabled, DragHandle }: SortableContainerChildProps<StoredLayoutDataByTypeName<LayoutType>>) => (
        <LayoutEditorCard
          isDisabled={isDisabled}
          index={index}
          item={item}
          sdk={sdk}
          key={`${item.type}-${item.id}`}
          onRemove={() =>
            fieldEditor.setImmediateValue(items.filter((_value, i) => i !== index)).then(() => {
              sdk.entry.save();
            })
          }
          renderDragHandle={DragHandle}
          fieldEditor={patchedFieldEditor}
        />
      )}
    </SortableList>
  );
}
