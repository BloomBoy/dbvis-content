import { AlignmentData, alignmentFields, FieldMap } from "../../shared";

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
            }
          }
        }
      },
    },
  ],
}

export interface LayoutThemeingData {
  backgroundColor?: string;
  textColor?: string;
  sizing?: 'card' | 'content-contained' | 'content-stretched';
}



export const layoutThemeingFields: FieldMap<LayoutThemeingData> = {
  backgroundColor: {
    type: 'Symbol',
    validations: [
      {
        regexp: {
          pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
          flags: 'i',
        }
      }
    ],
  },
  textColor: {
    type: 'Symbol',
    validations: [
      {
        regexp: {
          pattern: '^#([A-F0-9]{6}|[A-F0-9]{3}|brand(?:\\[[0-9]00\\])?)$',
          flags: 'i',
        }
      }
    ],
  },
  sizing: [{
    type: 'Symbol',
    required: false,
    validations: [
      {
        in: ['card', 'content-contained', 'content-stretched'],
      },
    ],
  }, { id: 'dropdown' }],
}