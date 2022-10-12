import { AlignmentData, alignmentFields } from '../../shared';
import makeComponent from '../../utils/makeComponent';

interface ButtonData extends AlignmentData {
  asset: string;
};

const Button = makeComponent<ButtonData>({
  name: 'Image',
  subFields: {
    ...alignmentFields,
    asset: {
      type: 'Link',
      linkType: 'Asset',
      title: 'Image',
      required: true,
    },
  },
});

export default Button;
