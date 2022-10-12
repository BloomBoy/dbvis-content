import makeLayout from '../../utils/makeLayout';
import { HasHeaderLayoutData, hasHeaderSubFields } from './common';

interface SlideViewData {
  button: unknown;
}

interface SlideViewLayoutData extends HasHeaderLayoutData {
}

const ColumnLayoutEditor = makeLayout<SlideViewLayoutData, SlideViewData>({
  name: 'Slideview',
  title: 'title',
  componentContainerFields: {
    button:
      {
        type: 'RichText',
        required: true,
      },
  },
  configurableSlotCount: 1,
  subFields: {
    ...hasHeaderSubFields
  },
});

export default ColumnLayoutEditor;
