import { SerializedJSONValue } from "@contentful/app-sdk";
import { Stack } from "@contentful/f36-components";
import { useMemo, useRef, useCallback } from "react";
import { ComponentDataByTypeName, FullComponentProps, ComponentTypeName } from "../../ComponentTypeDefinitions";
import useSubFields from "../../hooks/useSubFields";
import SubField from "../SubField";

export default function DefaultComponentEditor<ComponentName extends ComponentTypeName>(props: FullComponentProps<
  ComponentDataByTypeName<ComponentName>,
  ComponentName
>) {
  const {
    sdk,
    data,
    baseId,
    definition,
  } = props;
  const subFields = useSubFields(definition.subFields);
  const propsRef = useRef(props);
  propsRef.current = props;

  const setFieldValue = useCallback(
    async (key: keyof typeof subFields, value: any) => {
      const ret = propsRef.current.setValue({
        id: propsRef.current.id,
        type: propsRef.current.type,
        data: {
          ...propsRef.current.data,
          [key]: value,
        },
      });
      return ret as unknown as SerializedJSONValue | undefined;
    },
    [],
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
        return (
        <SubField
          key={key}
          id={`${baseId}.data`}
          sdk={sdk}
          setValue={setter}
          value={data[key]}
          subField={subField}
          subFieldKey={key}
          widget={widget}
          helpText={subField.helpText}
        />
        );
      })}
    </Stack>
  );
}
