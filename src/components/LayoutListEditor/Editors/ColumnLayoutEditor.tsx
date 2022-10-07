import makeLayout, {
  BaseLayoutProps,
  ComponentContainer,
} from '../makeLayout';

interface ColumnProperties extends ComponentContainer {}

interface ColumnsLayoutProps extends BaseLayoutProps<ColumnProperties[]> {
  title: string;
}


const ColumnLayoutEditor = makeLayout<ColumnsLayoutProps>(
  {
    name: 'Columns Layout',
    title: 'title',
    subFields: {
      title: {
        type: 'Symbol',
        required: true,
      },
      slots: {
        type: 'Array',
        required: true,
      }
    },
  },
);

export default ColumnLayoutEditor;
