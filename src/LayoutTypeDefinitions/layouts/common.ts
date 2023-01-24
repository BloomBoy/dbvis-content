import { Link } from 'contentful-management';
import {
  tailwindClassFields,
  FieldMap,
  FieldTypeDefinition,
  FieldMapEntry,
  TailwindData,
} from '../../shared';
import { fromEntries, objectEntries } from '../../utils/objects';

export interface LayoutHeaderData {
  title?: string;
  subTitle?: string;
  renderHeader: boolean;
}
export const layoutHeaderSubFields: FieldMap<LayoutHeaderData> = {
  title: {
    type: 'Symbol',
    includeInQuicksettings: true,
  },
  subTitle: {
    type: 'Symbol',
    includeInQuicksettings: true,
  },
  renderHeader: [
    {
      title: 'Visibilty',
      type: 'Boolean',
    },
    {
      id: 'boolean',
      settings(widget, sdk) {
        if (widget !== 'boolean') return {};
        return {
          boolean: {
            parameters: {
              ...sdk.parameters,
              instance: {
                ...sdk.parameters.instance,
                trueLabel: 'Render header above layout',
                falseLabel: 'Do not render header above layout',
              },
            },
          },
        };
      },
    },
  ],
};

type Capitalize<T extends string> = T extends `${infer L}${infer R}`
  ? `${Uppercase<L>}${R}`
  : T;

type Uncapitalize<T extends string> = T extends `${infer L}${infer R}`
  ? `${Lowercase<L>}${R}`
  : T;

type ContentTailwindFields = {
  [key in `content${Capitalize<
    keyof TailwindData
  >}`]: key extends `content${infer Q}`
    ? TailwindData[Uncapitalize<Q> & keyof TailwindData]
    : never;
};
export interface LayoutThemeingData extends TailwindData, ContentTailwindFields {
  textColor: string;
  backgroundColor: string;
  backgroundImage: Link<'Asset'>;
  contentBackgroundColor: string;
  contentBackgroundImage: Link<'Asset'>;
}

function capitalize<T extends string>(str: T): Capitalize<T> {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}` as Capitalize<T>;
}

type TailwindClassEntries = {
  [key in keyof typeof tailwindClassFields]: [
    key,
    typeof tailwindClassFields[key] extends FieldMapEntry<infer V>
      ? FieldMapEntry<V>
      : never,
  ];
}[keyof typeof tailwindClassFields & string][];

function mapContentTailwindClassFieldEntry<
  E extends TailwindClassEntries[number],
>([key, value]: [E[0], E[1]]): [`content${Capitalize<E[0]>}`, E[1]] {
  let ret: typeof value;
  type FieldTypeDef = FieldTypeDefinition<any>;
  let fieldDef: FieldTypeDef;
  if (Array.isArray(value)) {
    fieldDef =
      typeof value[0] === 'string'
        ? ({ type: value[0], title: key } as FieldTypeDef)
        : ({ ...value[0], title: value[0].title || key } as FieldTypeDef);
    ret = [fieldDef, value[1]] as E[1];
  } else {
    ret = (
      typeof value === 'string'
        ? ({ type: value, title: key } as FieldTypeDef)
        : ({
            ...(value as FieldTypeDef),
            title: (value as { title?: string }).title || key,
          } as FieldTypeDef)
    ) as E[1];
    fieldDef = ret as FieldTypeDef;
  }
  fieldDef.title = `Content ${fieldDef.title}`;
  const newKey = `content${capitalize(key as E[0])}` as const;
  return [newKey, ret];
}

export const contentTailwindClasses = fromEntries(
  objectEntries(tailwindClassFields).map(mapContentTailwindClassFieldEntry),
);

export const layoutThemeingFields: FieldMap<LayoutThemeingData> = {
  textColor: {
    type: 'Symbol',
    title: 'Text Color',
    validations: [
      {
        regexp: {
          pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
          flags: 'i',
        },
      },
    ],
  },
  backgroundColor: {
    type: 'Symbol',
    title: 'Background Color',
    validations: [
      {
        regexp: {
          pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
          flags: 'i',
        },
      },
    ],
  },
  backgroundImage: {
    type: 'Link',
    linkType: 'Asset',
  },
  ...tailwindClassFields,
  contentBackgroundColor: {
    type: 'Symbol',
    title: 'Content Background Color',
    validations: [
      {
        regexp: {
          pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
          flags: 'i',
        },
      },
    ],
  },
  contentBackgroundImage: {
    type: 'Link',
    linkType: 'Asset',
  },
  ...contentTailwindClasses,
};
