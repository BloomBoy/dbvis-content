import { AlignmentData, alignmentFields, FieldMap } from '../../shared';

export interface HasHeaderLayoutData extends AlignmentData {
  title?: string;
  subTitle?: string;
  renderHeader: boolean;
}

export const hasHeaderSubFields: FieldMap<HasHeaderLayoutData> = {
  title: 'Symbol',
  subTitle: 'Symbol',
  ...alignmentFields,
  renderHeader: [
    {
      type: 'Boolean',
    },
    {
      id: 'boolean',
      settings(widget, sdk) {
        if (widget !== 'boolean') return {};
        return {
          parameters: {
            ...sdk.parameters,
            instance: {
              ...sdk.parameters.instance,
              trueLabel: 'Render header',
              falseLabel: 'Do not render header',
            },
          },
        };
      },
    },
  ],
};

export interface LayoutThemeingData {
  backgroundColor?: string;
  containerBgColor?: string;
  textColor?: string;
  sizing?:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl'
    | 'full';
}

export const layoutThemeingFields: FieldMap<LayoutThemeingData> = {
  backgroundColor: {
    type: 'Symbol',
    excludeFromQuicksettings: true,
    validations: [
      {
        regexp: {
          pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
          flags: 'i',
        },
      },
    ],
  },
  containerBgColor: {
    type: 'Symbol',
    excludeFromQuicksettings: true,
    validations: [
      {
        regexp: {
          pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
          flags: 'i',
        },
      },
    ],
  },
  textColor: {
    type: 'Symbol',
    excludeFromQuicksettings: true,
    validations: [
      {
        regexp: {
          pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
          flags: 'i',
        },
      },
    ],
  },
  sizing: [
    {
      type: 'Symbol',
      title: 'Size',
      excludeFromQuicksettings: true,
      required: false,
      default: '7xl',
      validations: [
        {
          in: [
            'xs',
            'sm',
            'md',
            'lg',
            'xl',
            '2xl',
            '3xl',
            '4xl',
            '5xl',
            '6xl',
            '7xl',
          ],
        },
      ],
    },
    { id: 'dropdown' },
  ],
};
