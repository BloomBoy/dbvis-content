import { Link } from 'contentful-management';
import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

interface ButtonData extends TailwindData {
  asset: Link<'Asset'>;
};

const Button = makeComponent<ButtonData>({
  name: 'Image',
  subFields: {
    ...tailwindClassFields,
    asset: {
      type: 'Link',
      linkType: 'Asset',
      title: 'Image',
      required: true,
    },
  },
});

export default Button;
