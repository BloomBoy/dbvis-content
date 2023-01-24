import makeComponent from '../../../utils/makeComponent';
import { fromEntries, objectEntries } from '../../../utils/objects';
import Title, { TitleData } from '../contentComponents/title';

const omitFields = ['title', 'subTitle'] as const;

export interface LayoutTitleData
  extends Omit<TitleData, typeof omitFields[number]> {}

const LayoutTitle = makeComponent<LayoutTitleData>({
  name: 'Layout Title',
  subFields: fromEntries(
    objectEntries(Title.subFields).filter(
      (e): e is Exclude<typeof e, [typeof omitFields[number], never]> =>
        omitFields.every((key) => key !== e[0]),
    ),
  ),
});

export default LayoutTitle;
