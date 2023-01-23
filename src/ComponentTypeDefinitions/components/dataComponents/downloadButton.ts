import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

interface DownloadButtonData extends TailwindData {
  buttonText: string;
  hoverWidget: boolean;
}

const DownloadButton = makeComponent<DownloadButtonData>({
  name: 'Download Button',
  subFields: {
    buttonText: {
      type: 'Symbol',
      title: 'Button Text',
      default: 'Download For Free',
      required: true,
    },
    ...tailwindClassFields,
    hoverWidget: {
      type: 'Boolean',
      title: 'Show download widget on hover',
      required: true,
      default: true,
    },
  },
});

export default DownloadButton;
