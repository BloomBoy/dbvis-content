import makeComponent from '../../utils/makeComponent';

type ButtonData = {
  asset: string;
};

const Button = makeComponent<ButtonData>({
  name: 'Image',
  subFields: {
    asset: {
      type: 'Link',
      linkType: 'Asset',
      title: 'Image',
      required: true,
    },
  },
});

export default Button;
