import { ExtendedFieldConnectorChildProps } from '../../hooks/useFieldEditor';
import { EditorOptions } from '@contentful/default-field-editors';
import { ContentTypeFieldValidation, FieldType } from 'contentful-management';
import { DbVisComponent } from '../DbvisComponent';
import { FieldExtensionSDK, Items } from '@contentful/app-sdk';
import React from 'react';

export type ProvidedLayoutProps<Key extends string> = {
  type: Key;
  id: string;
};

type WidgetType = keyof EditorOptions;

export type SubFields<LayoutProps extends BaseLayoutProps> = {
  [key in keyof LayoutProps]:
    | FieldDefinition<LayoutProps[key]>
    | [
        field: FieldDefinition<LayoutProps[key]>,
        widget?: WidgetDefinition<WidgetType>,
      ];
};

export type AppProps<
  LayoutProps extends BaseLayoutProps,
  Type extends string,
> = {
  fieldEditor: ExtendedFieldConnectorChildProps<
    StoredLayoutProps<LayoutProps, Type>
  >;
  definition: LayoutTypeDef<LayoutProps, Type>;
  renderDragHandle?(props: {
    drag: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  }): JSX.Element;
  onRemove(): Promise<unknown>;
};

export interface ComponentContainer {
  components: DbVisComponent[];
}

export type BaseLayoutProps<Slots extends ComponentContainer[] = any[]> = {
  slots: Slots;
};

export interface WidgetDefinition<Widget extends WidgetType = WidgetType> {
  id: Widget;
  settings?:
    | NonNullable<EditorOptions[Widget]>
    | ((
        widgetId: string,
        sdk: FieldExtensionSDK,
      ) => NonNullable<EditorOptions[Widget]>);
}

export type FieldTypeDefinition<Type> = FieldType & {
  /** Title */
  title?: string;
  /** Indicates if a value for this field is required */
  required?: boolean;
  /** A list of validations for this field that are defined in the content type. */
  validations?: ContentTypeFieldValidation[];
  /** Defines the shape of array items */
  items?: Items;
  /** The default value to initialize it to */
  default?: Type;
  /** Whether to exclude this field from the quicks ettings */
  excludeFromQuicksettings?: boolean;
};

export type FieldDefinition<Type> =
  | FieldTypeDefinition<Type>
  | Exclude<FieldType['type'], 'Array' | 'Link'>;

export interface LayoutTypeDef<
  LayoutProps extends BaseLayoutProps,
  Type extends string,
> {
  name: string;
  title:
    | Exclude<keyof LayoutProps, 'slots'>
    | ((props: ProvidedLayoutProps<Type>) => string | undefined | null);
  subFields: SubFields<LayoutProps>;
  renderModal?:
    | React.ComponentType<FullLayoutProps<LayoutProps, Type>>
    | boolean;
  renderQuickSettings?:
    | React.ComponentType<FullLayoutProps<LayoutProps, Type>>
    | boolean;
}

export type StoredLayoutProps<
  LayoutProps extends BaseLayoutProps,
  Type extends string = string,
> = Partial<LayoutProps> & ProvidedLayoutProps<Type>;

export type FullLayoutProps<
  LayoutProps extends BaseLayoutProps,
  Type extends string = string,
> = Partial<LayoutProps> &
  ProvidedLayoutProps<Type> &
  AppProps<LayoutProps, Type>;

export default function makeLayout<LayoutProps extends BaseLayoutProps>(
  opts: LayoutTypeDef<LayoutProps, string>,
) {
  return opts;
}
