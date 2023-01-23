import { TailwindData, tailwindClassFields } from '../../../shared';
import makeComponent from '../../../utils/makeComponent';

export interface TitleData extends TailwindData {
  title: string;
  subTitle: string;
}

const Title = makeComponent<TitleData>({
  name: 'Title',
  subFields: {
    title: 'Symbol',
    subTitle: 'Symbol',
    ...tailwindClassFields,
  },
});

export default Title;
