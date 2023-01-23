import { spacingLabels, spacings, tailwindClassFields, TailwindData } from '../../shared';
import makeLayout from '../../utils/makeLayout';
import {
  LayoutHeaderData,
  layoutHeaderSubFields,
  LayoutThemeingData,
  layoutThemeingFields,
} from './common';

interface ColumnData
  extends Pick<LayoutThemeingData, 'backgroundColor'>, TailwindData {
    textColor: string;
    inlineComponents: boolean;
  }

interface ColumnLayoutData extends LayoutHeaderData, LayoutThemeingData {
  hGapSize?: string;
  vGapSize?: string;
}

const ColumnLayout = makeLayout<ColumnLayoutData, ColumnData>({
  name: 'Columns',
  title: 'title',
  componentContainerFields: {
    backgroundColor: layoutThemeingFields.backgroundColor,
    inlineComponents: 'Boolean',
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
    ...tailwindClassFields,
  },
  configurableSlotCount: 1,
  componentContainerName: ['Column', 'Columns'],
  subFields: {
    ...layoutHeaderSubFields,
    hGapSize: [
      {
        type: 'Symbol',
        title: 'Horizontal Gap Size',
        required: false,
        validations: [
          {
            in: [...spacings],
          },
        ],
      },
      {
        id: 'labeledDropdown',
        settings: { labeledDropdown: { labels: spacingLabels } },
      },
    ],
    vGapSize: [
      {
        type: 'Symbol',
        title: 'Vertical Gap Size',
        required: false,
        validations: [
          {
            in: [...spacings],
          },
        ],
      },
      {
        id: 'labeledDropdown',
        settings: { labeledDropdown: { labels: spacingLabels } },
      },
    ],
    ...layoutThemeingFields,
  },
});

export default ColumnLayout;
