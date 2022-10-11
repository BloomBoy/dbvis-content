import { SerializedJSONValue } from '@contentful/app-sdk';
import { Stack } from '@contentful/f36-components';
import { useCallback, useMemo, useRef } from 'react';
import { useSubFieldEditor } from '../../hooks/useFieldEditor';
import useSubFields from '../../hooks/useSubFields';
import {
  LayoutTypeName,
  FullLayoutProps,
  LayoutDataByTypeName,
  LayoutContainerDataByTypeName,
} from '../../LayoutTypeDefinitions';
import { pathToString } from '../../utils/deepValue';
import SubField from '../SubField';

export default function DefaultQuickSettings<
  LayoutType extends LayoutTypeName,
>(props: FullLayoutProps<
  LayoutDataByTypeName<LayoutType>,
  LayoutContainerDataByTypeName<LayoutType>,
  LayoutType
>) {
  const {
    id,
    sdk,
    definition,
    index,
    setValue,
    data,
  } = props;
  const subFields = useSubFields(definition.subFields);
  const fieldId = useMemo(() => {
    return pathToString([{ index, id }]);
  }, [index, id]);

  const propsRef = useRef(props);
  propsRef.current = props;

  const setFieldValue = useCallback(
    async (key: keyof typeof subFields, value: any) => {
      const ret = setValue({
        id: propsRef.current.id,
        slots: propsRef.current.slots,
        type: propsRef.current.type,
        data: {
          ...propsRef.current.data,
          [key]: value,
        },
      });
      return ret as unknown as SerializedJSONValue | undefined;
    },
    [setValue],
  );

  const subFieldsWithSetter = useMemo(() => {
    return subFields.map((props) => {
      return {
        ...props,
        setter<Value = any>(value: Value) {
          return setFieldValue(props.key as keyof typeof subFields, value);
        },
      };
    });
  }, [subFields, setFieldValue]);

  return (
    <Stack flexDirection="column" alignItems="stretch" padding="spacingS">
      {subFieldsWithSetter.map(({ key, subField, widget, setter }) => {
        if (subField.excludeFromQuicksettings) return null;
        return (
          <SubField
            key={key}
            id={fieldId}
            sdk={sdk}
            setValue={setter}
            value={data[key]}
            subField={subField}
            subFieldKey={key}
            widget={widget}
          />
        );
      })}
    </Stack>
  );
}
