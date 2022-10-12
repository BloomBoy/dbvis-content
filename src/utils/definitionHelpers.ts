import { useMemo } from "react";
import { EditorOptions } from '@contentful/default-field-editors';
import { ComponentContainer, LayoutTypeDef } from "../LayoutTypeDefinitions";
import { objectEntries } from "./objects";
import { FieldDefinition, WidgetDefinition, FieldMap } from "../shared";

export const DEFAULT_SLOT_NAME: [singular: string, plural: string] = ['Slot', 'Slots'];

export function getId(): string {
  const now = BigInt(Date.now());
  const rand = BigInt(Math.floor(Math.random() * 1000));
  const baseNum = now + rand;
  const bitReversed = BigInt(
    `0b${baseNum.toString(2).split('').reverse().join('')}`,
  );
  const merged = baseNum ^ bitReversed;
  return merged.toString(36).padStart(8, '0');
}

export function resolveConfigurableSlotCount(conf: number | boolean | [min: number, max: number] | undefined): [min: number, max: number] | false {
  if (conf === false) {
    return false;
  } else if (Array.isArray(conf)) {
    return conf
  } else if (typeof conf === 'number') {
    return [conf, Infinity];
  } else {
    return [0, Infinity];
  }
}
export function useResolveConfigurableSlotCount(...args: Parameters<typeof resolveConfigurableSlotCount>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => resolveConfigurableSlotCount(...args), args);
}

export function slotSectionTitle(name = DEFAULT_SLOT_NAME) {
  return name[1];
}
export function useSlotSectionTitle(...args: Parameters<typeof slotSectionTitle>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => slotSectionTitle(...args), args);
}
export function slotTitle<ContainerData>(slot: 
  | keyof ContainerData
  | ((props: Partial<ContainerData>, index: number) => string)
  | undefined,
  data: Partial<ContainerData>,
  slotName = DEFAULT_SLOT_NAME,
  index: number,
  ) {
  if (slot == null) {
    return `${slotName[0]} ${index + 1}`;
  }
  if (typeof slot === 'function') {
    return slot(data, index) || `${slotName[0]} ${index + 1}`;
  } else {
    return (data[slot] && String(data[slot])) || `${slotName[0]} ${index + 1}`;
  }
}
export function useSlotTitle<ContainerData>(...args: Parameters<typeof slotTitle<ContainerData>>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => slotTitle(...args), args);
}

export function getDefaultFieldVal<Type>(
  fieldDef:
    | FieldDefinition<Type>
    | [
        field: FieldDefinition<Type>,
        widget?: WidgetDefinition<keyof EditorOptions> | undefined,
      ],
): Type | undefined {
  let resolvedFieldDef: FieldDefinition<Type>;
  if (Array.isArray(fieldDef)) {
    resolvedFieldDef = fieldDef[0];
  } else {
    resolvedFieldDef = fieldDef;
  }

  if (typeof resolvedFieldDef === 'string') return undefined;
  return resolvedFieldDef.default;
}

export function getDefaultFieldMap<Data extends {}>(
  subFields: FieldMap<Data>,
): Partial<Data> {
  const defaultData: Partial<Data> = {};
  if (subFields != null) {
    objectEntries(subFields).forEach((entry) => {
      defaultData[entry[0]] = getDefaultFieldVal(entry[1]);
    });
  }
  return defaultData;
}

export function getDefaultLayoutData<Layout extends LayoutTypeDef<any, any, any>>(layout: Layout) {
  return getDefaultFieldMap(layout.subFields);
}

export function getDefaultSlotData<Layout extends LayoutTypeDef<any, any, any>>(layout: Layout) {
  return getDefaultFieldMap(layout.componentContainerFields);
}

export function createSlot<Layout extends LayoutTypeDef<any, any, any>>(definition: Layout) {
  const newSlot: ComponentContainer<Layout extends LayoutTypeDef<any, infer ComponentData, any> ? ComponentData: never> = {
    id: getId(),
    components: [],
    data: getDefaultFieldMap(definition.componentContainerFields),
  }
  return newSlot;
}