import { FieldExtensionSDK, Items } from "@contentful/app-sdk";
import { EditorOptions } from "@contentful/default-field-editors";
import { ContentTypeFieldValidation, FieldType } from "contentful-management";

type WidgetType = keyof EditorOptions;

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

export type FieldMap<Data> = {
  [key in keyof Data & string]:
    | FieldDefinition<Data[key]>
    | [
        field: FieldDefinition<Data[key]>,
        widget?: WidgetDefinition<WidgetType>,
      ];
};

export interface AlignmentData {
  alignment: 'left' | 'center' | 'right';
}

export const alignmentFields: FieldMap<AlignmentData> = {
  alignment: [{
    type: 'Symbol',
    required: false,
    default: 'left',
    validations: [
      {
        in: ['left', 'center', 'right'],
      },
    ],
  }, { id: 'dropdown' }],
}