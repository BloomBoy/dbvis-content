import { SerializedJSONValue } from '@contentful/app-sdk';
import { Box, Collapse, Stack, Subheading } from '@contentful/f36-components';
import { ChevronDownTrimmedIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { css, cx } from 'emotion';
import { useCallback, useMemo, useRef, useState } from 'react';
import useSubFields from '../../hooks/useSubFields';
import {
  LayoutTypeName,
  FullLayoutProps,
  LayoutDataByTypeName,
  LayoutContainerDataByTypeName,
} from '../../LayoutTypeDefinitions';
import attachInternalTitle from '../../utils/attachInternalTitle';
import { pathToString } from '../../utils/deepValue';
import SubField from '../SubField';

export default function DefaultQuickSettings<LayoutType extends LayoutTypeName>(
  props: FullLayoutProps<
    LayoutDataByTypeName<LayoutType>,
    LayoutContainerDataByTypeName<LayoutType>,
    LayoutType
  > & {
    title: string;
  },
) {
  const { id, sdk, definition, index, data } = props;
  const subFields = useSubFields(definition.subFields);
  const [expanded, setExpanded] = useState(false);
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
    return attachInternalTitle(subFields).map((props) => {
      return {
        ...props,
        setter<Value = any>(value: Value) {
          return setFieldValue(props.key as keyof typeof subFields, value);
        },
      };
    });
  }, [subFields, setFieldValue]);

  return (
    <Box
      className={css({
        marginTop: `-${tokens.spacingS}`,
        marginBottom: `-${tokens.spacingS}`,
        marginLeft: `-${tokens.spacingM}`,
        marginRight: `-${tokens.spacingM}`,
      })}
    >
      <Subheading as="h2" marginBottom="none">
        <button
          className={css({
            display: 'flex',
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '0',
            margin: 0, // remove the default button margin in Safari.
            padding: tokens.spacingM,
            backgroundColor: 'transparent',
            fontFamily: tokens.fontStackPrimary,
            fontSize: tokens.fontSizeL,
            fontWeight: tokens.fontWeightDemiBold,
            lineHeight: tokens.lineHeightL,
            color: tokens.gray800,
            width: '100%',
            minWidth: '9px',
            cursor: 'pointer',
            transition: `background-color ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault},
        box-shadow ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`,
            '&:hover': {
              backgroundColor: tokens.gray100,
            },
            '&:focus': {
              backgroundColor: tokens.gray100,
              borderRadius: tokens.borderRadiusMedium,
              boxShadow: tokens.glowPrimary,
              outline: 'none',
            },
            '&:focus:not(:focus-visible)': {
              backgroundColor: 'transparent',
              borderRadius: 'unset',
              boxShadow: 'unset',
            },
            '&:focus-visible': {
              backgroundColor: tokens.gray100,
              borderRadius: tokens.borderRadiusMedium,
              boxShadow: tokens.glowPrimary,
            },
          })}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronDownTrimmedIcon
            className={cx(
              css({
                transform: 'rotate(0deg)',
                transition: `transform ${tokens.transitionDurationDefault} ${tokens.transitionEasingDefault}`,
                marginLeft: tokens.spacingM,
              }),
              expanded &&
                css({
                  transform: 'rotate(180deg)',
                }),
            )}
            variant="secondary"
          />
          {props.title}
        </button>
      </Subheading>
      <Collapse isExpanded={expanded}>
        <Stack flexDirection="column" alignItems="stretch" padding="spacingS">
          {subFieldsWithSetter.map(({ key, subField, widget, setter }) => {
            if (!subField.includeInQuicksettings) return null;
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
                helpText={subField.helpText}
              />
            );
          })}
        </Stack>
      </Collapse>
    </Box>
  );
}
