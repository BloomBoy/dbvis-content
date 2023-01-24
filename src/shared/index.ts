import { FieldExtensionSDK, Items } from '@contentful/app-sdk';
import { EditorOptions } from '@contentful/default-field-editors';
import {
  ContentTypeFieldValidation,
  FieldType,
  Link,
} from 'contentful-management';
import { ExtraEditorOptions } from '../extraFieldWidgets';
import { fromEntries, tupleMap } from '../utils/objects';

export type WidgetType = keyof EditorOptions | keyof ExtraEditorOptions;

export type WidgetDefinition<Widget extends WidgetType = WidgetType> = {
  [key in Widget]: {
    id: key;
    settings?:
      | NonNullable<EditorOptions & ExtraEditorOptions>
      | ((
          widgetId: string,
          sdk: FieldExtensionSDK,
        ) => NonNullable<EditorOptions & ExtraEditorOptions>);
  };
}[Widget];

export type SimpleFieldTypeNames = {
  [key in FieldType['type']]: Extract<{ type: key }, FieldType> extends never
    ? never
    : key;
}[FieldType['type']];

export type LinkFieldTypeNames = {
  [key in FieldType['type']]: Extract<
    { type: key; linkType: never },
    Extract<FieldType, { type: key; linkType: string }>
  > extends never
    ? never
    : key;
}[FieldType['type']];

export type ArrayFieldTypeNames = {
  [key in FieldType['type']]: Extract<
    { type: key; items: never },
    Extract<
      FieldType,
      {
        type: key;
        items:
          | Extract<FieldType, { type: 'Symbol' }>
          | Extract<FieldType, { type: LinkFieldTypeNames }>;
      }
    >
  > extends never
    ? never
    : key;
}[FieldType['type']];

type SimpleFieldTypeMap = {
  Symbol: string;
  Text: string;
  RichText: object;
  Integer: number;
  Number: number;
  Date: string;
  Boolean: boolean;
  Object: object;
  Location: { lat: number; lon: number };
};

interface BaseFieldTypeDefinition {
  /** Title */
  title?: string;
  /** Indicates if a value for this field is required */
  required?: boolean;
  /** A list of validations for this field that are defined in the content type. */
  validations?: ContentTypeFieldValidation[];
  /** Whether to include this field in the quick settings */
  includeInQuicksettings?: boolean;
  /** A text to display around the input field to aid with usage */
  helpText?: string;
}

export interface SimpleFieldTypeDefinition<Type extends SimpleFieldTypeNames>
  extends BaseFieldTypeDefinition {
  /** The data type of the field */
  type: Type;
  /** The default value to initialize it to */
  default?: SimpleFieldTypeMap[Type];
}

export interface LinkFieldtypeDefinition<
  Type extends LinkFieldTypeNames,
  LinkType extends Extract<FieldType, { type: LinkFieldTypeNames }>['linkType'],
> extends BaseFieldTypeDefinition {
  /** The data type of the field */
  type: Type;
  /** The type of link */
  linkType: LinkType;
  /** The default value to initialize it to */
  default?: Link<LinkType>;
}

export interface ArrayFieldTypeDefinition<
  Type extends ArrayFieldTypeNames,
  ItemType extends Items,
> extends BaseFieldTypeDefinition {
  /** The data type of the field */
  type: Type;
  /** Defines the shape of array items */
  items?: {
    [key in keyof ItemType]: ItemType[key];
  } & {
    validations?: ContentTypeFieldValidation[];
  };
  /** The default value to initialize it to */
  default?: ItemType['type'] extends keyof SimpleFieldTypeMap
    ? SimpleFieldTypeMap[ItemType['type']][]
    : ItemType extends { type: 'Link'; linkType: string }
    ? Link<ItemType['linkType']>[]
    : never;
}

type LinkFieldTypeDefinitions = {
  [key in LinkFieldTypeNames]: {
    [key2 in Extract<
      FieldType,
      { type: LinkFieldTypeNames }
    >['linkType']]: LinkFieldtypeDefinition<key, key2>;
  }[Extract<FieldType, { type: LinkFieldTypeNames }>['linkType']];
}[LinkFieldTypeNames];

type ArrayFieldTypeDefinitions = {
  [key in ArrayFieldTypeNames]: {
    [key2 in Extract<
      FieldType,
      { type: ArrayFieldTypeNames }
    >['items']['type']]: key2 extends LinkFieldTypeNames
      ? {
          [key3 in Extract<
            FieldType,
            {
              type: ArrayFieldTypeNames;
              items: {
                type: Extract<
                  FieldType,
                  { type: ArrayFieldTypeNames }
                >['items']['type'];
                linkType: string;
              };
            }
          >['items']['linkType']]: ArrayFieldTypeDefinition<
            key,
            { type: key2; linkType: key3 }
          >;
        }[Extract<
          FieldType,
          {
            type: ArrayFieldTypeNames;
            items: {
              type: Extract<
                FieldType,
                { type: ArrayFieldTypeNames }
              >['items']['type'];
              linkType: string;
            };
          }
        >['items']['linkType']]
      : ArrayFieldTypeDefinition<key, Extract<FieldType, { type: key2 }>>;
  }[Extract<FieldType, { type: ArrayFieldTypeNames }>['items']['type']];
}[ArrayFieldTypeNames];

type AllFieldTypeDefinition =
  | {
      [key in SimpleFieldTypeNames]: SimpleFieldTypeDefinition<key>;
    }[SimpleFieldTypeNames]
  | LinkFieldTypeDefinitions
  | ArrayFieldTypeDefinitions;

export type FieldTypeDefinition<Type> = Extract<
  AllFieldTypeDefinition,
  { default?: Type }
>;

export type FieldDefinition<Type> =
  | FieldTypeDefinition<Type>
  | (FieldTypeDefinition<Type>['type'] & SimpleFieldTypeNames);

export type FieldMapEntry<Type> =
  | FieldDefinition<Type>
  | [field: FieldDefinition<Type>, widget?: WidgetDefinition<WidgetType>];

export type FieldMap<Data> = {
  [key in keyof Data]: FieldMapEntry<Data[key]>;
};

const numericSpacings = [
  0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28,
  32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
] as const;

export const spacings = [
  '0',
  'px',
  ...tupleMap(numericSpacings, (n) => `${n}` as `${typeof n}`),
] as const;

const BASE_SIZE = 4;

export const spacingLabels: {
  [key in typeof spacings[number]]: string;
} = {
  0: '0px',
  px: '1px',
  ...fromEntries(
    tupleMap(
      numericSpacings,
      (n) => [`${n}` as `${typeof n}`, `${n * BASE_SIZE}px`] as const,
    ),
  ),
};

export interface TailwindData {
  classes: string[];
}

export const tailwindClassFields: FieldMap<TailwindData> = {
  classes: [
    {
      type: 'Array',
      title: 'Tailwind Classes',
      items: {
        type: 'Symbol',
      },
      required: false,
    },
    { id: 'tagEditor' },
  ],
};
