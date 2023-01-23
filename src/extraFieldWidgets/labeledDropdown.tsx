import {
  PredefinedValuesError,
  FieldConnector,
  FieldAPI,
} from '@contentful/field-editor-shared';
import { nanoid } from 'nanoid';
import { css } from 'emotion';
import { Select } from '@contentful/f36-components';
import { DropdownEditor } from '@contentful/field-editor-dropdown';

interface DropdownEditorProps extends React.ComponentPropsWithoutRef<typeof DropdownEditor> {
  labels?: Record<string | number, string | undefined>
}

type DropdownOption = {
  id: string;
  value: string | number | undefined;
  label: string;
};

export function parseValue(value: string, fieldType: string): string | number | undefined {
  if (value === '') {
    return undefined;
  }
  if (fieldType === 'Integer' || fieldType === 'Number') {
    const asNumber = Number(value);
    return isNaN(asNumber) ? undefined : asNumber;
  }
  return value;
}

export function getOptions(field: FieldAPI, labels: DropdownEditorProps['labels']): DropdownOption[] {
  // Get first object that has a 'in' property
  const validations = field.validations || [];
  const predefinedValues = validations
    .filter((validation) => (validation as any).in)
    .map((validation) => (validation as any).in);

  const firstPredefinedValues = predefinedValues.length > 0 ? predefinedValues[0] : [];

  return firstPredefinedValues
    .map((value: string) => ({
      id: nanoid(6),
      value: parseValue(value, field.type),
      label: (labels?.[value] != null ? labels[value] : null) ?? String(value),
    }))
    .filter((item: { value: string | number | undefined; label: string }) => {
      return item.value !== undefined;
    });
}

var rightToLeft = css({
  direction: 'rtl',
});

export function LabeledDropdownEditor(props: DropdownEditorProps) {
  const { field, locales, labels } = props;

  const options = getOptions(field, labels);
  const misconfigured = options.length === 0;

  if (misconfigured) {
    return <PredefinedValuesError />;
  }

  const direction = locales.direction[field.locale] || 'ltr';

  return (
    <FieldConnector<string | number>
      throttle={0}
      field={field}
      isInitiallyDisabled={props.isInitiallyDisabled}>
      {({ value, errors, disabled, setValue }) => (
        <Select
          testId="labeled-dropdown-editor"
          isInvalid={errors.length > 0}
          isDisabled={disabled}
          className={direction === 'rtl' ? rightToLeft : ''}
          isRequired={field.required}
          value={value === undefined ? '' : String(value)}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value;
            setValue(parseValue(value, field.type));
          }}>
          <Select.Option value="">Choose a value</Select.Option>
          {options.map((option) => (
            <Select.Option key={option.value} value={String(option.value)}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      )}
    </FieldConnector>
  );
}

DropdownEditor.defaultProps = {
  isInitiallyDisabled: true,
};

