import ColumnsLayout from './Editors/ColumnLayoutEditor';
import { LayoutTypeDef, StoredLayoutProps } from './makeLayout';

function configureLayouts<T extends {
  [key: string]: any;
}>(layouts: T) {
  return layouts as unknown as {
    [key in keyof T & string]: T[key] extends LayoutTypeDef<infer Props, string> ? LayoutTypeDef<Props, key> : T[key];
   };
}

export const layouts = configureLayouts({
  ColumnsLayout,
});

export const LAYOUT_TYPES = Object.keys(layouts) as LayoutTypeName[];

export type Layout = typeof layouts[keyof typeof layouts];

export type StoredLayoutEntity = {
  [key in LayoutTypeName]: StoredLayoutProps<
    LayoutPropsByTypeName<key>,
    key
  >;
}[LayoutTypeName];


export type LayoutTypeName = keyof typeof layouts;

export type LayoutByTypeName<Type extends LayoutTypeName> = typeof layouts[Type];

export type LayoutPropsByTypeName<Type extends LayoutTypeName> = typeof layouts[Type] extends LayoutTypeDef<infer Props, Type> ? Props : never;
