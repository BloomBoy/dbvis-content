import { AlignmentData, alignmentFields } from '../../shared';
import makeComponent from '../../utils/makeComponent';

interface ButtonData extends AlignmentData {
  buttonText: string;
  target: string;
};

const Button = makeComponent<ButtonData>({
  name: 'Button',
  subFields: {
    buttonText: {
      type: 'Symbol',
      title: 'Button Text',
      required: true,
    },
    ...alignmentFields,
    target: [
      {
        type: 'Symbol',
        required: true,
      },
      { id: 'urlEditor' },
    ],
  },
});

export default Button;
