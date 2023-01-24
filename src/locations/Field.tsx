import React, { useEffect } from 'react';
import { Note, Paragraph, List, ListItem } from '@contentful/f36-components';
import {
  ContentTypeAPI,
  EditorExtensionSDK,
  FieldExtensionSDK,
} from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { EntityProvider } from '@contentful/field-editor-reference';
import LayoutListEditor from '../components/LayoutListEditor';

function IncorrectContentType(props: {
  sdk: EditorExtensionSDK;
  errors: { key: string; message: string }[];
}) {
  return (
    <Note variant="negative">
      <Paragraph>
        This content type is not properly configured for the Layout Editor. The
        following errors were detected:
      </Paragraph>
      <List>
        {props.errors.map(({ key, message }) => (
          <ListItem key={key}>{message}</ListItem>
        ))}
      </List>
    </Note>
  );
}

function getAssetListField(contentType: ContentTypeAPI, fieldId: string) {
  return contentType.fields.find(
    (field) =>
      field.id === fieldId &&
      field.type === 'Array' &&
      field.items?.type === 'Link' &&
      field.items.linkType === 'Asset',
  );
}

function getReferenceListField(contentType: ContentTypeAPI, fieldId: string) {
  return contentType.fields.find(
    (field) =>
      field.id === fieldId &&
      field.type === 'Array' &&
      field.items?.type === 'Link' &&
      field.items.linkType === 'Entry',
  );
}

function isValidContentType(sdk: FieldExtensionSDK) {
  const errors: {
    key: string;
    message: string;
  }[] = [];
  const { assetListId: pageAssetsFieldId, entryListId: pageReferencesFieldId } =
    sdk.parameters.instance;
  const contentType = sdk.contentType;
  const contentField = contentType.fields.find((field) => {
    return field.id === sdk.field.id;
  });

  if (contentField == null) {
    errors.push({
      key: 'contentField',
      message: 'FATAL ERROR! Could not detect current field.',
    });
    return [false, errors] as const;
  }

  if (typeof pageAssetsFieldId !== 'string' && pageAssetsFieldId !== '') {
    errors.push({
      key: 'pageAssetsFieldId',
      message: `The 'pageAssetsFieldId' instance parameter must be a non-empty string`,
    });
  } else {
    const assetListField = getAssetListField(contentType, pageAssetsFieldId);
    if (assetListField == null) {
      errors.push({
        key: `asset-${pageAssetsFieldId}`,
        message: `Field for Page Asset Reference (field id: '${pageAssetsFieldId}') is missing or of the wrong type, expected type Array<Asset>`,
      });
    } else if (assetListField.localized !== contentField.localized) {
      errors.push({
        key: `asset-${pageAssetsFieldId}`,
        message: `${assetListField.name} must have the same localization setting as ${contentField.name}`,
      });
    }
  }

  if (
    typeof pageReferencesFieldId !== 'string' &&
    pageReferencesFieldId !== ''
  ) {
    errors.push({
      key: 'pageReferencesFieldId',
      message: `The 'pageReferencesFieldId' instance parameter must be a non-empty string`,
    });
  } else {
    const referenceListField = getReferenceListField(
      contentType,
      pageReferencesFieldId,
    );
    if (referenceListField == null) {
      errors.push({
        key: `reference-${pageReferencesFieldId}`,
        message: `Field ${pageReferencesFieldId} is missing or of the wrong type, expected type Array<Entry>`,
      });
    } else if (referenceListField.localized !== contentField.localized) {
      errors.push({
        key: `reference-${pageReferencesFieldId}`,
        message: `${referenceListField.name} must have the same localization setting as ${contentField.name}`,
      });
    }
  }

  return [errors.length === 0, errors] as const;
}

export default function Field() {
  const sdk = useSDK<FieldExtensionSDK>();
  useEffect(() => {
    sdk.window.startAutoResizer();
    return () => {
      sdk.window.stopAutoResizer();
    };
  }, [sdk.window]);
  const [valid, errors] = isValidContentType(sdk);

  if (!valid) {
    return <IncorrectContentType sdk={sdk} errors={errors} />;
  }

  const { assetListId, entryListId } = sdk.parameters.instance;

  const { [assetListId]: pageAssetList, [entryListId]: pageReferenceList } =
    sdk.entry.fields;

  return (
    <EntityProvider sdk={sdk}>
      <LayoutListEditor
        assetListField={pageAssetList.getForLocale(sdk.field.locale)}
        referenceListField={pageReferenceList.getForLocale(sdk.field.locale)}
      />
    </EntityProvider>
  );
}
