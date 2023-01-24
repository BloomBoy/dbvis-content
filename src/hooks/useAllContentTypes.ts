import { BaseExtensionSDK } from '@contentful/app-sdk';
import { useCMA } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { useState, useEffect } from 'react';

export default function useAllContentTypes(sdk: BaseExtensionSDK) {
  const cma = useCMA();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);

  useEffect(() => {
    cma.contentType
      .getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      })
      .then((allContentTypes) => {
        setContentTypes(allContentTypes.items);
      });
  }, [cma.contentType, sdk.ids.environment, sdk.ids.space]);

  return contentTypes;
}
