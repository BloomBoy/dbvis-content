import React, { useEffect } from "react";
import { Note, Paragraph } from "@contentful/f36-components";
import {
  ContentTypeAPI,
  EditorExtensionSDK,
  FieldExtensionSDK,
} from "@contentful/app-sdk";
import { /* useCMA, */ useSDK } from "@contentful/react-apps-toolkit";
import { EntityProvider } from '@contentful/field-editor-reference';
import LayoutListEditor from "../components/LayoutListEditor";

function IncorrectContentType(props: {
  sdk: EditorExtensionSDK;
  missingFields: {
    id: string;
    type: string;
  }[];
}) {
  return (
    <Note variant="negative">
      <Paragraph>
        Due to technical reasons, some require helper fields to be defined in
        the content type. Please add the following fields to the content type:
      </Paragraph>
      <Paragraph>
        {props.missingFields
          .map((item) => `${item.id} (${item.type})`)
          .join(", ")}
      </Paragraph>
    </Note>
  );
}

function NonStandardFieldId({ sdk }: { sdk: FieldExtensionSDK }) {
  const [isOpen, setIsOpen] = React.useState(sdk.field.id !== "pageLayout");
  if (!isOpen) return null;
  return (
    <Note
      variant="warning"
      title={'This field is not named "pageLayout"'}
      withCloseButton
      onClose={() => setIsOpen(false)}
    >
      This is using a non-standard id for the field. This will not get rendered
      correctly.
    </Note>
  );
}

function hasAssetList(contentType: ContentTypeAPI) {
  return contentType.fields.find(
    (field) =>
      field.id === "pageAssets" &&
      field.type === "Array" &&
      field.items?.type === "Link" &&
      field.items.linkType === "Asset"
  );
}

function hasReferenceList(contentType: ContentTypeAPI) {
  return contentType.fields.find(
    (field) =>
      field.id === "pageReferences" &&
      field.type === "Array" &&
      field.items?.type === "Link" &&
      field.items.linkType === "Entry"
  );
}

function isValidContentType(contentType: ContentTypeAPI) {
  const missingFields: {
    id: string;
    type: string;
  }[] = [];

  if (!hasAssetList(contentType)) {
    missingFields.push({
      id: "pageAssets",
      type: "Array<Asset>",
    });
  }

  if (!hasReferenceList(contentType)) {
    missingFields.push({
      id: "pageReferences",
      type: "Array<Entry>",
    });
  }

  return [missingFields.length === 0, missingFields] as const;
}

export default function Field() {
  const sdk = useSDK<FieldExtensionSDK>();
  useEffect(() => {
    sdk.window.startAutoResizer();
    return () => {
      sdk.window.stopAutoResizer();
    }
  }, [sdk.window]);
  const [valid, missingFields] = isValidContentType(sdk.contentType);



  if (!valid) {
    return <IncorrectContentType sdk={sdk} missingFields={missingFields} />;
  }

  return (
    <EntityProvider sdk={sdk}>
      <NonStandardFieldId sdk={sdk} />
      <LayoutListEditor />
    </EntityProvider>
  );
};
