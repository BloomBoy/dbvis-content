import makeLayout from '../../utils/makeLayout';
import { HasHeaderLayoutData, hasHeaderSubFields, LayoutThemeingData, layoutThemeingFields } from './common';

interface ColumnData {}

interface ColumnLayoutData extends HasHeaderLayoutData, LayoutThemeingData {
}


const ColumnLayout = makeLayout<ColumnLayoutData, ColumnData>(
  {
    name: 'Columns',
    title: 'title',
    componentContainerFields: {},
    configurableSlotCount: 1,
    componentContainerName: ['Column', 'Columns'],
    subFields: {
      ...hasHeaderSubFields,
      ...layoutThemeingFields,
    },
  },
);

export default ColumnLayout;
