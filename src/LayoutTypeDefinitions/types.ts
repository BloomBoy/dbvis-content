import { ExtendedFieldConnectorChildProps } from '../hooks/useFieldEditor';
import { EditorOptions } from '@contentful/default-field-editors';
import { ContentTypeFieldValidation, FieldType } from 'contentful-management';
import { StoredComponentEntity } from '../ComponentTypeDefinitions';
import { FieldExtensionSDK, Items, SerializedJSONValue } from '@contentful/app-sdk';
import React from 'react';

type WidgetType = keyof EditorOptions;

export type FieldMap<Data> = {
  [key in keyof Data & string]:
    | FieldDefinition<Data[key]>
    | [
        field: FieldDefinition<Data[key]>,
        widget?: WidgetDefinition<WidgetType>,
      ];
};

export type AppProps<LayoutData, ContainerData, Type extends string> = {
  setValue(value: StoredLayoutData<LayoutData, ContainerData, Type>): Promise<SerializedJSONValue | undefined>;
  setImmediateValue(value: StoredLayoutData<LayoutData, ContainerData, Type>): Promise<SerializedJSONValue | undefined>;
  removeValue(): Promise<undefined>;
  definition: LayoutTypeDef<LayoutData, ContainerData, Type>;
  index: number;
  renderDragHandle?(props: {
    drag: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  }): JSX.Element;
  sdk: FieldExtensionSDK;
};

export interface ComponentContainer<ContainerData> {
  components: StoredComponentEntity[];
  id: string;
  data: Partial<ContainerData>;
}

export type WidgetDefinition<Widget extends WidgetType = WidgetType> = {
  [key in Widget]: {
    id: key;
    settings?:
      | NonNullable<EditorOptions[key]>
      | ((
          widgetId: string,
          sdk: FieldExtensionSDK,
        ) => NonNullable<EditorOptions[key]>);
  };
}[Widget];

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

export interface LayoutTypeDef<LayoutData, ContainerData, Type extends string> {
  name: string;
  title:
    | keyof LayoutData
    | ((
        props: StoredLayoutData<LayoutData, ContainerData, Type>,
      ) => string | undefined | null);
  subFields: FieldMap<LayoutData>;
  componentContainerName?: [singular: string, plural: string];
  componentContainerFields: FieldMap<ContainerData>;
  componentContainerTitle?:
    | keyof ContainerData
    | ((props: Partial<ContainerData>, index: number) => string);
  configurableSlotCount?: number | boolean | [min: number, max: number];
  defaultSlots?: ComponentContainer<ContainerData>[];
  renderModal?:
    | React.ComponentType<FullLayoutProps<LayoutData, ContainerData, Type>>
    | boolean;
  renderQuickSettings?:
    | React.ComponentType<FullLayoutProps<LayoutData, ContainerData, Type>>
    | boolean;
  renderSlotsEditor?:
    | React.ComponentType<FullLayoutProps<LayoutData, ContainerData, Type>>
    | boolean;
}

export type StoredLayoutData<
  LayoutData,
  ContainerData,
  Type extends string = string,
> = {
  data: Partial<LayoutData>;
  slots: ComponentContainer<ContainerData>[];
  type: Type;
  id: string;
};

export type FullLayoutProps<
  LayoutData,
  ContainerData,
  Type extends string = string,
> = StoredLayoutData<LayoutData, ContainerData, Type> &
  AppProps<LayoutData, ContainerData, Type>;
