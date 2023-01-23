import {
  Accordion,
  Box,
  Button,
  HeadingElement,
  IconButton,
  Paragraph,
  SectionHeading,
  Stack,
  Subheading,
} from '@contentful/f36-components';
import { PlusIcon, DeleteIcon } from '@contentful/f36-icons';
import {
  isValidElement,
  Children,
  DetailedHTMLProps,
  forwardRef,
  HTMLAttributes,
  useCallback,
  useMemo,
  useRef,
  useState,
  cloneElement,
} from 'react';
import useSubFields from '../../hooks/useSubFields';
import {
  ComponentContainer,
  FullLayoutProps,
  LayoutContainerDataByTypeName,
  LayoutDataByTypeName,
  LayoutTypeName,
} from '../../LayoutTypeDefinitions';
import * as definitionHelpers from '../../utils/definitionHelpers';
import SubField from '../SubField';
import * as styles from '../ComponentEditor/styles';
import ComponentListEditor from '../ComponentListEditor';
import { SerializedJSONValue } from '@contentful/app-sdk';
import { pathToString } from '../../utils/deepValue';
import { css, cx } from 'emotion';

const MakeTitleComponent = ({
  as = 'h2',
  onDelete,
  singularSlotName,
}: {
  as?: HeadingElement;
  onDelete?: () => void;
  singularSlotName: string;
}) =>
  forwardRef<HTMLHeadingElement>(
    (
      {
        children,
        ...props
      }: DetailedHTMLProps<
        HTMLAttributes<HTMLHeadingElement>,
        HTMLHeadingElement
      >,
      ref,
    ) => {
      const El = as;
      if (onDelete == null || !isValidElement(children)) {
        return <El>{children}</El>;
      }
      const [chevron, ...grandChildren] = Children.toArray(
        children.props.children,
      );
      return (
        <El {...props} ref={ref}>
          {cloneElement(
            children,
            undefined,
            chevron,
            <IconButton
              aria-hidden
              tabIndex={-1}
              className={styles.accordionButton}
              icon={<DeleteIcon variant="negative" />}
              title={`Delete ${singularSlotName}`}
              aria-label={`Delete ${singularSlotName}`}
            />,
            ...grandChildren,
          )}
          <div
            className={cx(children.props.className, styles.mockAccordionHeader)}
          >
            {isValidElement(chevron)
              ? cloneElement(chevron, {
                  className: cx(chevron.props.className, styles.mockChevron),
                } as any)
              : chevron}
            <IconButton
              onClick={(ev: React.MouseEvent) => {
                onDelete();
              }}
              className={styles.accordionButton}
              icon={<DeleteIcon variant="negative" />}
              title={`Delete ${singularSlotName}`}
              aria-label={`Delete ${singularSlotName}`}
            />
          </div>
        </El>
      );
    },
  ) as unknown as HeadingElement;

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
          propsRef.current.setValue({
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
    return pathToString([
      { index, id },
      'slots',
      { index: slotIndex, id: slot.id },
    ]);
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

  const titleWithDelete = useMemo(
    () =>
      MakeTitleComponent({
        onDelete: onDelete != null ? handleOnRemove : undefined,
        singularSlotName,
      }),
    [onDelete, handleOnRemove, singularSlotName],
  );

  if (props.inAccordion) {
    return (
      <>
        {subFieldsWithSetter.length > 0 ? (
          <>
            <Accordion.Item
              titleElement={titleWithDelete}
              title={`${title} - Settings`}
              className={styles.accordionItemWithButton}
            >
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
                    helpText={subField.helpText}
                  />
                );
              })}
            </Accordion.Item>
            <Accordion.Item title={`${title} - Components`}>
              <ComponentListEditor {...props} />
            </Accordion.Item>
          </>
        ) : (
          <Accordion.Item
            titleElement={titleWithDelete}
            title={`${title} - Components`}
            className={styles.accordionItemWithButton}
          >
            <ComponentListEditor {...props} />
          </Accordion.Item>
        )}
      </>
    );
  }

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
            helpText={subField.helpText}
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
      .setValue({
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
    propsRef.current.setValue({
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

  if (props.inAccordion) {
    return (
      <>
        <Box className={styles.accordionItemStyles} as="li">
          <Subheading as="h2" marginBottom="none">
            <Box
              className={cx(
                styles.accordionHeaderStyle,
                css({
                  backgroundColor: 'transparent !important',
                  cursor: 'auto',
                }),
              )}
            >
              <Box>
                {!isFull && (
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
                )}
              </Box>
              {slotCount} {slotCount === 1 ? singularSlotName : pluralSlotName}
            </Box>
          </Subheading>
        </Box>
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
