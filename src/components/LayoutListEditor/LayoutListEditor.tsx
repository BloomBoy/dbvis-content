import React, { useCallback, useMemo, useRef } from "react";
import arrayMove from 'array-move';
import { FieldExtensionSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { SortEndHandler, SortStartHandler } from "react-sortable-hoc";
import useFieldEditor from "../../hooks/useFieldEditor";
import LayoutEditor from "./Editors";
import LayoutActions from "./LayoutActions";
import {layouts, LAYOUT_TYPES, StoredLayoutEntity } from "./LayoutTypeDefinitions";
import SortableLayoutList from "./SortableLayoutList";
import { BaseLayoutProps, FieldDefinition, LayoutTypeDef, WidgetDefinition } from "./makeLayout";
import { objectEntries } from "../../utils/objects";
import { EditorOptions } from "@contentful/default-field-editors";

type EntryLink = {
  sys: {
    type: "Link";
    linkType: "Entry";
    id: string;
  };
};
type AssetLink = {
  sys: {
    type: "Link";
    linkType: "Asset";
    id: string;
  };
};

type ChildProps = {
  items: StoredLayoutEntity[];
  isDisabled: boolean;
  setValue: (value: StoredLayoutEntity[]) => Promise<unknown>;
  onSortStart: SortStartHandler;
  onSortEnd: SortEndHandler;
  onMove: (oldIndex: number, newIndex: number) => void;
};

type EditorProps = Omit<ChildProps, "onSortStart" | "onSortEnd" | "onMove"> & {
  setImmediateValue: ChildProps['setValue'];
  children: (props: ChildProps) => React.ReactElement;
};

function getId(): string {
  const now = BigInt(Date.now());
  const rand = BigInt(Math.floor(Math.random() * 1000));
  const baseNum = now + rand;
  const bitReversed = BigInt(`0b${baseNum.toString(2).split("").reverse().join("")}`);
  const merged = baseNum ^ bitReversed;
  return (merged).toString(36).padStart(8, "0");
}

function getDefaultFieldVal<Type>(fieldDef: FieldDefinition<Type> | [field: FieldDefinition<Type>, widget?: WidgetDefinition<keyof EditorOptions> | undefined]): Type | undefined {
  let resolvedFieldDef: FieldDefinition<Type>;
  if (Array.isArray(fieldDef)) {
    resolvedFieldDef = fieldDef[0];
  } else {
    resolvedFieldDef = fieldDef;
  }

  if (typeof resolvedFieldDef === 'string') return undefined;
  return resolvedFieldDef.default;
}

function getDefaultProps<Props extends BaseLayoutProps<any[]>>(layout: LayoutTypeDef<Props, any>): Props {
  const defaultProps: Partial<Props> = {};
  defaultProps.slots = layout.defaultSlots;
  if (layout.subFields != null) {
    objectEntries(layout.subFields).forEach((entry) => {
      defaultProps[entry[0]] = getDefaultFieldVal(entry[1]);
    });
  }
  return defaultProps as Props;
}

function onLinkOrCreate(
  setValue: ChildProps['setValue'],
  items: ChildProps['items'],
  types: typeof LAYOUT_TYPES[number][],
  index = items.length
): Promise<unknown> {
  const id = getId();
  const newLayouts: StoredLayoutEntity[] = types.map((type) => ({ type, id, ...getDefaultProps(layouts[type]) }));
  const newItems = Array.from(items);
  newItems.splice(index, 0, ...newLayouts);
  return setValue(newItems);
}

function Editor({ setImmediateValue, ...props }: EditorProps) {

  const { items } = props;

  const onSortStart: SortStartHandler = useCallback(
    (_, event) => event.preventDefault(),
    []
  );
  const onSortEnd: SortEndHandler = useCallback(
    ({ oldIndex, newIndex }) => {
      const newItems = arrayMove(items, oldIndex, newIndex);
      setImmediateValue(newItems);
    },
    [items, setImmediateValue]
  );
  const onMove = useCallback(
    (oldIndex: number, newIndex: number) => {
      const newItems = arrayMove(items, oldIndex, newIndex);
      setImmediateValue(newItems);
    },
    [items, setImmediateValue]
  );

  const onCreate = useCallback(
    (type: typeof LAYOUT_TYPES[number], index?: number) =>
      onLinkOrCreate(setImmediateValue, items, [type], index),
    [setImmediateValue, items]
  );

  return (
    <>
      {props.children({
        ...props,
        onSortStart: onSortStart,
        onSortEnd: onSortEnd,
        onMove,
      })}
      <LayoutActions
        addNewLayout={onCreate}
        isFull={false}
        isEmpty={items.length === 0}
      />
    </>
  );
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

  const wrappedSetValue = useCallback<typeof fieldEditor.setValue>((...args) => {
    return fieldEditorRef.current.setValue( ...args);
  }, []);

  const patchedFieldEditor = useMemo<typeof fieldEditor>(() => ({
    ...fieldEditor,
    setValue: wrappedSetValue,
  }), [fieldEditor, wrappedSetValue]);

  const { value: rawValue, setValue, disabled } = patchedFieldEditor;

  const value = Array.isArray(rawValue) ? rawValue : emptyArray;

  return (
    <Editor
      items={value}
      isDisabled={false}
      setValue={setValue}
      setImmediateValue={fieldEditor.setImmediateValue}
    >
      {(childProps) => (
        <SortableLayoutList<StoredLayoutEntity[][number]>
          {...childProps}
          items={value}
          isDisabled={disabled}
          axis={false ? "xy" : "y"}
          useDragHandle={true}
        >
          {({ items, item, index, isDisabled, DragHandle }) => (
            <LayoutEditor
              {...childProps}
              item={item}
              isDisabled={isDisabled}
              key={`${item.type}-${item.id}`}
              onRemove={() => setValue(items.filter((_value, i) => i !== index))}
              renderDragHandle={DragHandle}
              fieldEditor={patchedFieldEditor}
            />
          )}
        </SortableLayoutList>
      )}
    </Editor>
  );
}
