import { FieldAPI, FieldExtensionSDK, SerializedJSONValue } from '@contentful/app-sdk';
import { FormControl } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ContentFields, editorInterfaceDefaults, KeyValueMap } from 'contentful-management';
import { css, cx } from 'emotion';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ExtendedFieldConnectorChildProps } from '../hooks/useFieldEditor';
import {
  FieldMap,
  FieldTypeDefinition,
  WidgetDefinition,
} from '../LayoutTypeDefinitions';
import { NumberEditor } from '@contentful/field-editor-number';
import { SingleLineEditor } from '@contentful/field-editor-single-line';
import { BooleanEditor } from '@contentful/field-editor-boolean';
import { DateEditor } from '@contentful/field-editor-date';
import { LocationEditor } from '@contentful/field-editor-location';
import { JsonEditor } from '@contentful/field-editor-json';
import { MultipleLineEditor } from '@contentful/field-editor-multiple-line';
import { TagsEditor } from '@contentful/field-editor-tags';
import { SlugEditor } from '@contentful/field-editor-slug';
import { DropdownEditor } from '@contentful/field-editor-dropdown';
import { UrlEditor } from '@contentful/field-editor-url';
import { RadioEditor } from '@contentful/field-editor-radio';
import { RatingEditor } from '@contentful/field-editor-rating';
import { CheckboxEditor } from '@contentful/field-editor-checkbox';
import { ListEditor } from '@contentful/field-editor-list';
import {
  SingleEntryReferenceEditor,
  MultipleEntryReferenceEditor,
  SingleMediaEditor,
  MultipleMediaEditor,
} from '@contentful/field-editor-reference';
import { RichTextEditor } from '@contentful/field-editor-rich-text';
import { MarkdownEditor } from '@contentful/field-editor-markdown';

export const styles = {
  withFocusBar: css({
    marginLeft: tokens.spacingL,
    marginRight: tokens.spacingL,
    marginBottom: '29px',
    marginTop: '19px',
    paddingLeft: tokens.spacingM,
    borderLeft: `3px solid ${tokens.gray300}`,
    transition: 'border-color 0.18s linear',
    '&:focus-within': {
      borderColor: tokens.colorPrimary,
    },
    '&[aria-invalid="true"]': {
      borderLeftColor: tokens.red500,
    },
  }),
  label: css({
    display: 'flex',
    width: '100%',
    maxWidth: '800px',
    color: tokens.gray500,
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightNormal,
    lineHeight: tokens.lineHeightDefault,
    whiteSpace: 'pre-wrap',
  }),
  helpText: css({
    margin: `${tokens.spacingXs} 0`,
    fontStyle: 'italic',
  }),
};

const widgetComponents: Record<string, [React.ComponentType<any>, any?]> = {
  multipleLine: [MultipleLineEditor],
  boolean: [BooleanEditor],
  objectEditor: [JsonEditor],
  datePicker: [DateEditor],
  locationEditor: [LocationEditor],
  checkbox: [CheckboxEditor],
  listInput: [ListEditor],
  rating: [RatingEditor],
  radio: [RadioEditor],
  tagEditor: [TagsEditor],
  numberEditor: [NumberEditor],
  urlEditor: [UrlEditor],
  slugEditor: [SlugEditor],
  singleLine: [SingleLineEditor],
  dropdown: [DropdownEditor],
  entryLinkEditor: [SingleEntryReferenceEditor, { viewType: 'link', hasCardEditActions: true }],
  entryCardEditor: [SingleEntryReferenceEditor, { viewType: 'card', hasCardEditActions: true }],
  entryLinksEditor: [MultipleEntryReferenceEditor, { viewType: 'link', hasCardEditActions: true }],
  entryCardsEditor: [MultipleEntryReferenceEditor, { viewType: 'card', hasCardEditActions: true }],
  assetLinkEditor: [SingleMediaEditor, { viewType: 'link' }],
  assetLinksEditor: [MultipleMediaEditor, { viewType: 'link' }],
  assetGalleryEditor: [MultipleMediaEditor, { viewType: 'card' }],
  richTextEditor: [RichTextEditor],
  markdown: [MarkdownEditor],
};

export default function SubField<Data, Key extends keyof FieldMap<Data>>({
  id,
  sdk,
  setValue,
  disabled = false,
  subField,
  subFieldKey,
  widget,
  showFocusBar = false,
  className,
  renderHeading,
  renderHelpText,
  helpText = '',
  value,
}: {
  sdk: FieldExtensionSDK;
  value: Data[Key] | undefined | null;
  setValue: <Value = any>(value: Value) => Promise<SerializedJSONValue | undefined>;
  subField: FieldTypeDefinition<Data[Key]>;
  widget: WidgetDefinition | undefined;
  subFieldKey: Key;
  id: string;
  showFocusBar?: boolean;
  className?: string;
  helpText?: string;
  disabled?: boolean;
  renderHeading?: (name: string) => JSX.Element | null;
  renderHelpText?: (helpText: string) => JSX.Element | null;
}) {

  const field = useMemo<ContentFields>(() => ({
    id: `${id}.${subFieldKey}`,
    localized: sdk.contentType.fields.find(f => f.id === sdk.field.id)?.localized ?? false,
    disabled: disabled,
    name: subField.title ?? subFieldKey,
    required: subField.required ?? false,
    type: subField.type,
    items: subField.items,
    validations: subField.validations,
    defaultValue: subField.default as KeyValueMap,
  }), [id, subFieldKey, sdk.contentType.fields, sdk.field.id, disabled, subField.title, subField.required, subField.type, subField.items, subField.validations, subField.default]);

  const editorInterface = useMemo(() => editorInterfaceDefaults.default.getDefaultControlOfField(field), [field]);

  const widgetId = widget?.id ?? editorInterface.widgetId

  const valueListeners = useRef<((value: any) => void)[]>([]);

  useEffect(() => {
    valueListeners.current.forEach(l => l(value));
  }, [value]);

  const registerValueChangeListener = useCallback((callback: (value: any) => void) => {
    valueListeners.current.push(callback);
    return () => {
      valueListeners.current = valueListeners.current.filter(l => l !== callback);
    }
  }, []);

  const valueRef = useRef(value);
  valueRef.current = value;

  const fieldApi = useMemo<FieldAPI>(() => ({
    id: field.id,
    getValue() {
      return valueRef.current;
    },
    locale: sdk.field.locale,
    onIsDisabledChanged: () => () => {},
    onSchemaErrorsChanged: () => () => {},
    onValueChanged: registerValueChangeListener,
    removeValue: async () => {
      await setValue(undefined);
      return undefined;
    },
    setInvalid: () => {},
    setValue,
    validations: field.validations ?? [],
    disabled: field.disabled,
    type: field.type,
    items: field.items,
    required: field.required ?? false,
  }), [field.disabled, field.id, field.items, field.required, field.type, field.validations, registerValueChangeListener, sdk.field.locale, setValue]);

  const patchedSdk = useMemo(() => {
    return new Proxy(sdk, {
      get(target, prop, receiver) {
        if (prop === 'field') {
          return fieldApi;
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }, [sdk, fieldApi])

  if (!widgetComponents[widgetId]) return null;

  const [WidgetComponent, widgetStaticProps] = widgetComponents[widgetId];

  const options = typeof widget?.settings === 'function' ? widget.settings(widgetId, sdk) : widget?.settings ?? {};

  const widgetComponentProps = {
    sdk: patchedSdk,
    field: fieldApi,
    locales: sdk.locales,
    isInitiallyDisabled: field.disabled,
    parameters: {
      showCreateEntityAction: false,
      showLinkEntityAction: true,
    },
    ...widgetStaticProps,
    // @ts-expect-error
    ...options[widgetId],
  };

  const baseSdk = widgetId === 'slugEditor' ? sdk : undefined;

  console.log(widgetId, { widgetComponentProps })

  console.log(field);

  return (
    <FormControl
      id={`${id}.${subFieldKey}`}
      testId="custom_layout-field-controls"
      data-test-id="custom_layout-field-controls"
      className={cx(showFocusBar && styles.withFocusBar, className)}
      isRequired={subField.required}
    >
    {renderHeading ? (
        renderHeading(subField.title ?? subFieldKey)
      ) : (
        <FormControl.Label className={styles.label}>{subField.title ?? subFieldKey}</FormControl.Label>
      )}
        <WidgetComponent
          key={`${id}.${subFieldKey}-${sdk.field.locale}`}
          {...widgetComponentProps}
          baseSdk={baseSdk}
        />
    {renderHelpText ? (
        renderHelpText(helpText)
      ) : (
        <FormControl.HelpText testId="field-hint" className={styles.helpText}>
          {helpText}
        </FormControl.HelpText>
      )}
    </FormControl>
  );
}
