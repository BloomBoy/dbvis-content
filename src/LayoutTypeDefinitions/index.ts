import * as layoutDefinitions from './layouts';
import {
  FullLayoutProps,
  LayoutLink,
  LayoutTypeDef,
  StoredLayoutData,
} from './types';

export * from './types';

function configureLayouts<
  T extends {
    [key in `${string}Layout`]: any;
  },
>(layouts: T) {
  return layouts as {
    [key in keyof T & `${string}Layout`]: T[key] extends LayoutTypeDef<
      infer Data,
      infer ContainerData,
      `${string}Layout`
    >
      ? LayoutTypeDef<Data, ContainerData, key>
      : T[key];
  };
}

export const linkableLayoutTypes = ['layoutBlock'] as const;

export type LayoutLinkType = typeof linkableLayoutTypes[number];

export type LayoutLinks = {
  [key in LayoutLinkType]: LayoutLink<key>;
}[LayoutLinkType];

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

export type LayoutTypeDefByTypeName<Type extends LayoutTypeName> =
  LayoutTypeMap[Type];

export type StoredLayoutDataByTypeName<LayoutType extends LayoutTypeName> =
  StoredLayoutEntityMap[LayoutType];

export type StoredLayoutEntity = StoredLayoutEntityMap[LayoutTypeName];

export type LayoutTypeName = keyof LayoutTypeMap;

export type LayoutByTypeName<Type extends LayoutTypeName> =
  LayoutTypeMap[Type] extends LayoutTypeDef<
    infer Data,
    infer ContainerData,
    Type
  >
    ? LayoutTypeDef<Data, ContainerData, Type>
    : never;

export type LayoutDataByTypeName<Type extends LayoutTypeName> =
  LayoutTypeMap[Type] extends LayoutTypeDef<infer Data, any, Type>
    ? Data
    : never;

export type LayoutContainerDataByTypeName<Type extends LayoutTypeName> =
  LayoutTypeMap[Type] extends LayoutTypeDef<any, infer ContainerData, Type>
    ? ContainerData
    : never;

export type FullLayoutPropsByTypeName<Type extends LayoutTypeName> = {
  [key in LayoutTypeName]: FullLayoutProps<
    LayoutDataByTypeName<key>,
    LayoutContainerDataByTypeName<key>,
    key
  >;
}[Type];

export function isLayoutLinkType(
  type: string,
): type is `${string}Link` {
  return type.endsWith('Link');
}

export function isLayoutEntityType(
  type: string,
): type is `${string}Layout` {
  return type.endsWith('Layout');
}

export function isLayoutLink(link: LayoutLink<string> | StoredLayoutData<unknown, unknown, `${string}Layout`>): link is LayoutLink<string> {
  return isLayoutLinkType(link.type);
}

export function isLayoutEntity<Layout extends { type: string }>(layout: Layout): layout is Layout & { type: `${string}Layout` } {
  return isLayoutEntityType(layout.type);
}
