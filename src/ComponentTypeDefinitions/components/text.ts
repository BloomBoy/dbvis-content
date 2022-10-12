import { AlignmentData, alignmentFields } from '../../shared';
import makeComponent from '../../utils/makeComponent';

interface TextData extends AlignmentData {
  text: unknown;
}

const Text = makeComponent<TextData>({
  name: 'Text',
  subFields: {
    ...alignmentFields,
    text: {
      type: 'RichText',
      required: true,
    }
  },
});

export default Text;
