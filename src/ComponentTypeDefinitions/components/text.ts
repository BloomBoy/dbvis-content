import makeComponent from '../../utils/makeComponent';

type TextData = {
  text: unknown;
}

const Text = makeComponent<TextData>({
  name: 'Text',
  subFields: {
    text: {
      type: 'RichText',
      required: true,
    }
  },
});

export default Text;
