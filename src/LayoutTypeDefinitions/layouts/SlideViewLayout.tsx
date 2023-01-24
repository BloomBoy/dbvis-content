import { Link } from 'contentful-management';
import {
  FieldMapEntry,
  FieldTypeDefinition,
  tailwindClassFields,
  TailwindData,
} from '../../shared';
import makeLayout from '../../utils/makeLayout';
import { fromEntries, objectEntries } from '../../utils/objects';
import {
  LayoutHeaderData,
  layoutHeaderSubFields,
  LayoutThemeingData,
  layoutThemeingFields,
} from './common';

type Capitalize<T extends string> = T extends `${infer L}${infer R}`
  ? `${Uppercase<L>}${R}`
  : T;

type Uncapitalize<T extends string> = T extends `${infer L}${infer R}`
  ? `${Lowercase<L>}${R}`
  : T;

type ButtonTailwindFields = {
  [key in `button${Capitalize<
    keyof TailwindData
  >}`]: key extends `button${infer Q}`
    ? TailwindData[Uncapitalize<Q> & keyof TailwindData]
    : never;
};

interface SlideViewData extends TailwindData, ButtonTailwindFields {
  button: object;
  buttonActiveBackgroundColor: string;
  buttonHoverBackgroundColor: string;
  buttonBorderColor: string;
  buttonTextColor: string;
  backgroundColor: string;
  backgroundImage: Link<'Asset'>;
  textColor: string;
}

interface SlideViewLayoutData extends LayoutHeaderData, LayoutThemeingData {
  backgroundColor: string;
  buttonActiveBackgroundColor: string;
  buttonHoverBackgroundColor: string;
  buttonBorderColor: string;
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
function mapButtonTailwindClassFieldEntry<
  E extends TailwindClassEntries[number],
>([key, value]: [E[0], E[1]]): [`button${Capitalize<E[0]>}`, E[1]] {
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
  fieldDef.title = `Button ${fieldDef.title}`;
  const newKey = `button${capitalize(key as E[0])}` as const;
  return [newKey, ret];
}

export const buttonTailwindFields = fromEntries(
  objectEntries(tailwindClassFields).map(mapButtonTailwindClassFieldEntry),
);

const SlideViewLayout = makeLayout<SlideViewLayoutData, SlideViewData>({
  name: 'Slideview',
  title: 'title',
  componentContainerFields: {
    button: {
      type: 'RichText',
      required: true,
    },
    buttonActiveBackgroundColor: {
      type: 'Symbol',
      validations: [
        {
          regexp: {
            pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
            flags: 'i',
          },
        },
      ],
    },
    buttonHoverBackgroundColor: {
      type: 'Symbol',
      validations: [
        {
          regexp: {
            pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
            flags: 'i',
          },
        },
      ],
    },
    buttonBorderColor: {
      type: 'Symbol',
      validations: [
        {
          regexp: {
            pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
            flags: 'i',
          },
        },
      ],
    },
    buttonTextColor: {
      type: 'Symbol',
      validations: [
        {
          regexp: {
            pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
            flags: 'i',
          },
        },
      ],
    },
    ...buttonTailwindFields,
    backgroundColor: {
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
    backgroundImage: {
      title: 'Content Background Image',
      type: 'Link',
      linkType: 'Asset',
    },
    textColor: {
      type: 'Symbol',
      title: 'Content Text Color',
      validations: [
        {
          regexp: {
            pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
            flags: 'i',
          },
        },
      ],
    },
    ...tailwindClassFields,
  },
  configurableSlotCount: 1,
  subFields: {
    ...layoutHeaderSubFields,
    ...layoutThemeingFields,
    buttonActiveBackgroundColor: {
      type: 'Symbol',
      validations: [
        {
          regexp: {
            pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
            flags: 'i',
          },
        },
      ],
    },
    buttonHoverBackgroundColor: {
      type: 'Symbol',
      validations: [
        {
          regexp: {
            pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
            flags: 'i',
          },
        },
      ],
    },
    buttonBorderColor: {
      type: 'Symbol',
      validations: [
        {
          regexp: {
            pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
            flags: 'i',
          },
        },
      ],
    },
  },
});

export default SlideViewLayout;
