import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

interface TextData extends TailwindData {
  text: object;
}

const Text = makeComponent<TextData>({
  name: 'Text',
  subFields: {
    ...tailwindClassFields,
    text: {
      type: 'RichText',
      required: true,
    }
  },
});

export default Text;
