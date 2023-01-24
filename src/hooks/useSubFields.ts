import { useMemo } from 'react';
import { FieldMap, WidgetDefinition, FieldTypeDefinition } from '../shared';
import { objectEntries } from '../utils/objects';

export default function useSubFields<Data>(subFields: FieldMap<Data>) {
  return useMemo(() => {
    return objectEntries(subFields).map(([key, subField]) => {
      let widget: WidgetDefinition | undefined;
      let field: FieldTypeDefinition<Data[typeof key]>;
      if (Array.isArray(subField)) {
        if (typeof subField[0] === 'string') {
          field = {
            type: subField[0],
          } as FieldTypeDefinition<Data[keyof Data & string]>;
        } else {
          field = subField[0];
        }
        widget = subField[1];
      } else {
        if (typeof subField === 'string') {
          field = {
            type: subField,
          } as FieldTypeDefinition<Data[keyof Data & string]>;
        } else {
          field = subField as FieldTypeDefinition<Data[keyof Data & string]>;
        }
      }
      return {
        key,
        subField: field,
        widget,
      };
    });
  }, [subFields]);
}
