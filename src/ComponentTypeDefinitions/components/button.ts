import makeComponent from '../../utils/makeComponent';

type ButtonData = {
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
