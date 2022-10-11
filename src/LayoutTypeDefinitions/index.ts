import * as layoutDefinitions from './layouts';
import { FullLayoutProps, LayoutTypeDef, StoredLayoutData } from './types';

export * from './types';

function configureLayouts<T extends {
  [key: string]: any;
}>(layouts: T) {
  return layouts as unknown as {
    [key in keyof T & string]: T[key] extends LayoutTypeDef<infer Data, infer ContainerData, string> ? LayoutTypeDef<Data, ContainerData, key> : T[key];
   };
}

export const layouts = configureLayouts(layoutDefinitions);

export type LayoutTypeMap = typeof layouts;

export const LAYOUT_TYPES = Object.keys(layouts) as LayoutTypeName[];

export type Layout = typeof layouts[keyof typeof layouts];

export type StoredLayoutEntityMap = {
  [key in LayoutTypeName]: StoredLayoutData<
    LayoutDataByTypeName<key>,
    LayoutContainerDataByTypeName<key>,
    key
  >;
};


export type LayoutTypeDefByTypeName<Type extends LayoutTypeName> = LayoutTypeMap[Type];

export type StoredLayoutDataByTypeName<LayoutType extends LayoutTypeName> = StoredLayoutEntityMap[LayoutType];

export type StoredLayoutEntity = StoredLayoutEntityMap[LayoutTypeName];

export type LayoutTypeName = keyof LayoutTypeMap;

export type LayoutByTypeName<Type extends LayoutTypeName> = LayoutTypeMap[Type] extends LayoutTypeDef<infer Data, infer ContainerData, Type> ? LayoutTypeDef<Data, ContainerData, Type> : never;

export type LayoutDataByTypeName<Type extends LayoutTypeName> = LayoutTypeMap[Type] extends LayoutTypeDef<infer Data, any, Type> ? Data : never;

export type LayoutContainerDataByTypeName<Type extends LayoutTypeName> = LayoutTypeMap[Type] extends LayoutTypeDef<any, infer ContainerData, Type> ? ContainerData : never;

export type FullLayoutPropsByTypeName<Type extends LayoutTypeName> = {
  [key in LayoutTypeName]: FullLayoutProps<LayoutDataByTypeName<key>, LayoutContainerDataByTypeName<key>, key>;
}[Type];