import { Stack } from "@contentful/f36-components";
import { Dispatch, SetStateAction, useCallback, useMemo, useRef } from "react";
import DefaultComponentSlotsEditor from "./DefaultComponentSlotsEditor";
import { LayoutTypeName, FullLayoutProps, LayoutDataByTypeName, LayoutContainerDataByTypeName } from "../../LayoutTypeDefinitions";
import SubField from "../SubField";
import useSubFields from "../../hooks/useSubFields";
import { pathToString } from "../../utils/deepValue";
import { SerializedJSONValue } from "@contentful/app-sdk";

export default function DefaultModal<LayoutType extends LayoutTypeName>({
  open,
  setOpen,
  ...props
}: FullLayoutProps<
  LayoutDataByTypeName<LayoutType>,
  LayoutContainerDataByTypeName<LayoutType>,
  LayoutType
> & {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}): JSX.Element {
  const {
    id,
    sdk,
    definition,
    index,
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
      const ret = propsRef.current.setValue({
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

  const RenderComponentSlotsEditor =
    definition.renderSlotsEditor == null || definition.renderSlotsEditor === true
      ? DefaultComponentSlotsEditor
      : definition.renderSlotsEditor;

  return (
    <Stack flexDirection="column" alignItems="stretch" padding="spacingS">
      {subFieldsWithSetter.map(({ key, subField, widget, setter }) => {
        return (
          <SubField
            key={key}
            id={`${fieldId}.data`}
            sdk={sdk}
            setValue={setter}
            value={data[key]}
            subField={subField}
            subFieldKey={key}
            widget={widget}
          />
        );
      })}
      {RenderComponentSlotsEditor && <RenderComponentSlotsEditor {...props} />}
    </Stack>
  );
}