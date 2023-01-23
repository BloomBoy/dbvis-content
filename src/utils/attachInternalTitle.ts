import { FieldTypeDefinition, WidgetDefinition, WidgetType } from '../shared';

const internalTitleField = {
  key: '_internalTitle',
  subField: {
    type: 'Symbol',
    title: 'Contentful Internal Title',
    helpText:
      'The internal title is only used within contentful. Meant to help you identify the entities.',
    includeInQuicksettings: true,
  },
  widget: undefined,
};

export default function attachInternalTitle<
  T extends {
    key: string;
    subField: FieldTypeDefinition<any>;
    widget: WidgetDefinition<WidgetType> | undefined;
  },
>(fields: T[]): T[] {
  return [internalTitleField as T, ...fields];
}
