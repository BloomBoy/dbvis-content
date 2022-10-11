import { useMemo } from "react";
import { FieldMap, WidgetDefinition, FieldTypeDefinition } from "../LayoutTypeDefinitions";
import { objectEntries } from "../utils/objects";

export default function useSubFields<Data>(
  subFields: FieldMap<Data>,
) {
  return useMemo(() => {
    return objectEntries(subFields).map(([key, subField]) => {
      let widget: WidgetDefinition | undefined;
      let field: FieldTypeDefinition<
        Data[typeof key]
      >;
      if (Array.isArray(subField)) {
        if (typeof subField[0] === 'string') {
          field = {
            type: subField[0],
          };
        } else {
          field = subField[0];
        }
        widget = subField[1];
      } else {
        if (typeof subField === 'string') {
          field = {
            type: subField,
          };
        } else {
          field = subField;
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
