import { Link } from '@contentful/app-sdk';
import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

interface ImageButtonData extends TailwindData {
  asset: Link<'Asset', 'Link'>;
  target: string;
};

const ImageButton = makeComponent<ImageButtonData>({
  name: 'Image Button',
  subFields: {
    ...tailwindClassFields,
    target: [
      {
        type: 'Symbol',
        required: true,
      },
      { id: 'urlEditor' },
    ],
    asset: {
      type: 'Link',
      linkType: 'Asset',
      title: 'Image',
      required: true,
    },
  },
});

export default ImageButton;
