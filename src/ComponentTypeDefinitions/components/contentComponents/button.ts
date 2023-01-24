import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

interface ButtonData extends TailwindData {
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
    ...tailwindClassFields,
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
