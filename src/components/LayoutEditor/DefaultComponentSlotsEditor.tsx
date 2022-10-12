import {
  Box,
  Button,
  IconButton,
  Paragraph,
  SectionHeading,
  Stack,
} from '@contentful/f36-components';
import { PlusIcon, DeleteIcon } from '@contentful/f36-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import useSubFields from '../../hooks/useSubFields';
import {
  ComponentContainer,
  FullLayoutProps,
  LayoutContainerDataByTypeName,
  LayoutDataByTypeName,
  LayoutTypeName,
} from '../../LayoutTypeDefinitions';
import * as definitionHelpers from '../../utils/layoutDefinitionHelpers';
import SubField from '../SubField';
import * as styles from '../ComponentEditor/styles';
import ComponentListEditor from '../ComponentListEditor';
import { SerializedJSONValue } from '@contentful/app-sdk';
import { pathToString } from '../../utils/deepValue';

export function SlotEditor<LayoutType extends LayoutTypeName>(
  props: FullLayoutProps<
    LayoutDataByTypeName<LayoutType>,
    LayoutContainerDataByTypeName<LayoutType>,
    LayoutType
  > & {
    slot: ComponentContainer<LayoutContainerDataByTypeName<LayoutType>>;
    slotIndex: number;
    onDelete: null | ((index: number) => void);
  },
) {
  const propsRef = useRef(props);
  propsRef.current = props;
  const { onDelete, ...restProps } = props;
  const { id, sdk, slot, definition, index, slotIndex } = restProps;
  const title = definitionHelpers.useSlotTitle(
    definition.componentContainerTitle,
    slot.data,
    definition.componentContainerName,
    slotIndex,
  );

  const [singularSlotName] =
    definition.componentContainerName ?? definitionHelpers.DEFAULT_SLOT_NAME;

  const setFieldValue = useCallback(
    async (key: keyof typeof subFields, value: any) => {
      const newSlots = [...propsRef.current.slots];
      newSlots[propsRef.current.slotIndex] = {
        ...propsRef.current.slot,
        data: {
          ...propsRef.current.slot.data,
          [key]: value,
        },
      };
      const ret = propsRef.current.setValue({
        id: propsRef.current.id,
        slots: newSlots,
        type: propsRef.current.type,
        data: propsRef.current.data,
      });
      return ret as unknown as SerializedJSONValue | undefined;
    },
    [],
  );

  const handleOnRemove = useCallback(() => {
    sdk.dialogs
      .openConfirm({
        message: `This will delete the ${singularSlotName} '${title}' and any configuration and any components defined within. Reusable components are defined elsewhere and only imported. They will still be available to other layouts.`,
        intent: 'negative',
        confirmLabel: `Delete ${singularSlotName}`,
        title: `Delete ${singularSlotName}?`,
      })
      .then((shouldRemove) => {
        if (shouldRemove) {
          propsRef.current.setImmediateValue({
            data: propsRef.current.data,
            id: propsRef.current.id,
            type: propsRef.current.type,
            slots: [
              ...propsRef.current.slots.slice(0, propsRef.current.slotIndex),
              ...propsRef.current.slots.slice(propsRef.current.slotIndex + 1),
            ],
          });
        }
      });
  }, [sdk.dialogs, title, singularSlotName]);

  const subFields = useSubFields(definition.componentContainerFields);
  const fieldId = useMemo(() => {
    return pathToString([{ index, id }, 'slots', { index: slotIndex, id: slot.id }]);
  }, [index, id, slotIndex, slot.id]);

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
    <>
      <Stack justifyContent="space-between">
        <SectionHeading marginBottom="none">{title}</SectionHeading>
        {onDelete != null ? (
          <IconButton
            onClick={handleOnRemove}
            icon={<DeleteIcon variant="negative" />}
            title={`Delete ${singularSlotName}`}
            aria-label={`Delete ${singularSlotName}`}
          />
        ) : null}
      </Stack>
      {subFieldsWithSetter.map(({ key, subField, widget, setter }) => {
        return (
          <SubField
            key={key}
            id={`${fieldId}.data`}
            sdk={sdk}
            setValue={setter}
            value={slot.data[key]}
            subField={subField}
            subFieldKey={key}
            widget={widget}
          />
        );
      })}
      <ComponentListEditor {...props} />
    </>
  );
}

export default function DefaultComponentSlotEditor<
  LayoutType extends LayoutTypeName,
>(
  props: FullLayoutProps<
    LayoutDataByTypeName<LayoutType>,
    LayoutContainerDataByTypeName<LayoutType>,
    LayoutType
  >,
) {
  const { definition } = props;
  const configurableSlotCount =
    definitionHelpers.useResolveConfigurableSlotCount(
      definition.configurableSlotCount,
    );
  const [singularSlotName, pluralSlotName] =
    definition.componentContainerName ?? definitionHelpers.DEFAULT_SLOT_NAME;
  const isFull =
    configurableSlotCount === false ||
    props.slots.length >= configurableSlotCount[1];
  const slotCount = props.slots.length;

  const [isCreating, setIsCreating] = useState(false);

  const propsRef = useRef(props);
  propsRef.current = props;

  const onCreate = useCallback(() => {
    const oldSlots = propsRef.current.slots ?? [];
    const newSlot = definitionHelpers.createSlot(propsRef.current.definition);
    setIsCreating(true);
    propsRef.current
      .setImmediateValue({
        data: propsRef.current.data,
        id: propsRef.current.id,
        type: propsRef.current.type,
        slots: [...oldSlots, newSlot],
      })
      .finally(() => {
        setIsCreating(false);
      });
  }, []);

  const deleteSlot = useCallback((index: number) => {
    const oldSlots = propsRef.current.slots;
    if (oldSlots == null) {
      return;
    }
    const newSlots = [
      ...oldSlots.slice(0, index),
      ...oldSlots.slice(index + 1),
    ];
    propsRef.current.setImmediateValue({
      data: propsRef.current.data,
      id: propsRef.current.id,
      type: propsRef.current.type,
      slots: newSlots,
    });
  }, []);

  const canDelete =
    configurableSlotCount !== false &&
    slotCount > configurableSlotCount[0] &&
    slotCount > 0;

  /** No slots to display */
  if (configurableSlotCount === false || configurableSlotCount[1] === 0)
    return null;

  return (
    <>
      <SectionHeading>
        {slotCount} {slotCount === 1 ? singularSlotName : pluralSlotName}
      </SectionHeading>
      <Paragraph>
        {singularSlotName} contains the components that are displayed in this
        layout.
      </Paragraph>
      {!isFull && (
        <Box>
          <Button
            variant="secondary"
            className={styles.action}
            startIcon={<PlusIcon />}
            size="small"
            onClick={onCreate}
            isDisabled={isCreating}
          >
            Add {singularSlotName}
          </Button>
        </Box>
      )}
      {props.slots.map((slot, slotIndex) => (
        <SlotEditor
          {...props}
          key={slot.id}
          slot={slot}
          slotIndex={slotIndex}
          onDelete={canDelete ? deleteSlot : null}
        />
      ))}
    </>
  );
}
