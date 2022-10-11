import { FieldMap } from "../types";

export interface HasHeaderLayoutData {
  title: string;
  subTitle?: string;
  renderHeader: boolean;
}

export const hasHeaderSubFields: FieldMap<HasHeaderLayoutData> = {
  title: {
    type: 'Symbol',
    required: true,
  },
  subTitle: {
    type: 'Symbol',
    required: false,
  },
  renderHeader: [
    {
      type: 'Boolean',
      default: true,
      required: true,
      validations: [
        {
          in: ['true'],
        },
      ],
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