import makeLayout from '../../utils/makeLayout';
import { HasHeaderLayoutData, hasHeaderSubFields } from './common';

interface ColumnData {}

interface ColumnLayoutData extends HasHeaderLayoutData {
}


const ColumnLayout = makeLayout<ColumnLayoutData, ColumnData>(
  {
    name: 'Columns',
    title: 'title',
    componentContainerFields: {},
    configurableSlotCount: 1,
    componentContainerName: ['Column', 'Columns'],
    subFields: {
      ...hasHeaderSubFields
    },
  },
);

export default ColumnLayout;
