import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

interface SystemRequirementsData extends TailwindData {
  text: object;
}

const SystemRequirements = makeComponent<SystemRequirementsData>({
  name: 'System Requirements',
  subFields: {
    ...tailwindClassFields,
    text: {
      type: 'RichText',
      helpText: 'Override what\'s provided from the download data',
      required: false,
    },
  },
});

export default SystemRequirements;
