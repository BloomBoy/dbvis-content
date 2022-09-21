import React, { useCallback, useState, useEffect, Dispatch, SetStateAction } from "react";
import { AppExtensionSDK } from "@contentful/app-sdk";
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  TextInput,
  Subheading,
  FormControl,
} from "@contentful/f36-components";
import { css } from "emotion";
import { /* useCMA, */ useSDK } from "@contentful/react-apps-toolkit";

export interface AppInstallationParameters {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  siteImage: string;
  siteTwitterHandle: string;
  themeBrandColor: string;
  themeBackgroundColor: string;
}

interface ImmutableRefObject<T> {
  readonly current: T;
}

/**
 * Returns a stateful value, and a function to update it.
 */
function useInputValueWithRef(initialState?: string | (() => string)): [ ImmutableRefObject<string>, Dispatch<SetStateAction<string>>, (event: React.ChangeEvent<HTMLInputElement>) => void] {
  const [state, setState] = useState(initialState ?? '');
  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setState(event.target.value);
  }, []);
  const ref = React.useRef(state);
  ref.current = state;
  return [ref, setState, onChange];
}


const ConfigScreen = () => {
  const [siteNameRef, setSiteName, siteNameOnChange] = useInputValueWithRef();
  const [siteTaglineRef, setSiteTagline, siteTaglineOnChange] = useInputValueWithRef();
  const [siteDescriptionRef, setSiteDescription, siteDescriptionOnChange] = useInputValueWithRef();
  const [siteImageRef, setSiteImage, siteImageOnChange] = useInputValueWithRef();
  const [siteTwitterHandleRef, setSiteTwitterHandle, siteTwitterHandleOnChange] = useInputValueWithRef();
  const [themeBrandColorRef, setThemeBrandColor, themeBrandColorOnChange] = useInputValueWithRef();
  const [themeBackgroundColorRef, setThemeBackgroundColor, themeBackgroundColorOnChange] = useInputValueWithRef();

  const sdk = useSDK<AppExtensionSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const setParameters = useCallback(( parameters: AppInstallationParameters) => {
    setSiteName(parameters.siteName);
    setSiteTagline(parameters.siteTagline);
    setSiteDescription(parameters.siteDescription);
    setSiteImage(parameters.siteImage);
    setSiteTwitterHandle(parameters.siteTwitterHandle);
    setThemeBrandColor(parameters.themeBrandColor);
    setThemeBackgroundColor(parameters.themeBackgroundColor);
  }, [setSiteDescription, setSiteImage, setSiteName, setSiteTagline, setSiteTwitterHandle, setThemeBackgroundColor, setThemeBrandColor]);

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    const parameters: AppInstallationParameters = {
      siteName: siteNameRef.current,
      siteTagline: siteTaglineRef.current,
      siteDescription: siteDescriptionRef.current,
      siteImage: siteImageRef.current,
      siteTwitterHandle: siteTwitterHandleRef.current,
      themeBrandColor: themeBrandColorRef.current,
      themeBackgroundColor: themeBackgroundColorRef.current,
    };

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [sdk.app, siteDescriptionRef, siteImageRef, siteNameRef, siteTaglineRef, siteTwitterHandleRef, themeBackgroundColorRef, themeBrandColorRef]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk, setParameters]);

  return (
    <Flex
      flexDirection="column"
      className={css({ margin: "80px", maxWidth: "800px" })}
    >
      <Form>
        <Heading>Gloabal config</Heading>
        <Paragraph>
          Welcome! We're very much still exploring the Contentful App API, but
          it was specified that it is the most appropriate way to put things
          like global SEO configuration and similar.
        </Paragraph>
        <Subheading>Website Configuration</Subheading>
        <FormControl isRequired>
          <FormControl.Label htmlFor="siteName">Site Name</FormControl.Label>
          <TextInput id="siteName" type="text" value={siteNameRef.current} onChange={siteNameOnChange} maxLength={64} />
          <Flex justifyContent="space-between">
            <FormControl.HelpText>
              This is the name of the website, as it will appear in search
              engines and social media.
            </FormControl.HelpText>
            <FormControl.Counter />
          </Flex>
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label htmlFor="siteTagline">Site Tagline</FormControl.Label>
          <TextInput id="siteTagline" type="text" value={siteTaglineRef.current} onChange={siteTaglineOnChange} />
          <Flex justifyContent="space-between">
            <FormControl.HelpText>
              The tagline is a short description of the website, which is used together with siteName
              when as a long-form version of the name of the website.
            </FormControl.HelpText>
            <FormControl.Counter />
          </Flex>
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label htmlFor="siteDescription">Site Description</FormControl.Label>
          <TextInput id="siteDescription" type="text" value={siteDescriptionRef.current} onChange={siteDescriptionOnChange} maxLength={200} />
          <Flex justifyContent="space-between">
            <FormControl.HelpText>
              This is the description of the website, as it will appear in search
              engines and social media.
            </FormControl.HelpText>
            <FormControl.Counter />
          </Flex>
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label htmlFor="siteImage">Site Image</FormControl.Label>
          <TextInput id="siteImage" type="text" value={siteImageRef.current} onChange={siteImageOnChange} />
          <Flex justifyContent="space-between">
            <FormControl.HelpText>
              This is the URL of the image that will be used as the website's
              image, when embedded in search engines and social media.
            </FormControl.HelpText>
            <FormControl.Counter />
          </Flex>
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label htmlFor="siteTwitterHandle">Site Twitter Handle</FormControl.Label>
          <TextInput id="siteTwitterHandle" type="text" value={siteTwitterHandleRef.current} onChange={siteTwitterHandleOnChange} />
          <Flex justifyContent="space-between">
            <FormControl.HelpText>
              This is the Twitter handle of the website, including the @ symbol.
            </FormControl.HelpText>
            <FormControl.Counter />
          </Flex>
        </FormControl>
        <Heading>Theming</Heading>
        <FormControl isRequired>
          <FormControl.Label htmlFor="themeBrandColor">Site Brand Color</FormControl.Label>
          <TextInput id="themeBrandColor" type="text" value={themeBrandColorRef.current} onChange={themeBrandColorOnChange} />
          <Flex justifyContent="space-between">
            <FormControl.HelpText>
              This is the brand color of the website, which will be used for
              buttons and other UI elements, and in the SEO metadata
            </FormControl.HelpText>
            <FormControl.Counter />
          </Flex>
        </FormControl>
        <FormControl isRequired>
          <FormControl.Label htmlFor="themeBackgroundColor">UI background color</FormControl.Label>
          <TextInput id="themeBackgroundColor" type="text" value={themeBackgroundColorRef.current} onChange={themeBackgroundColorOnChange} />
          <Flex justifyContent="space-between">
            <FormControl.HelpText>
              The background color of the website body element. Also what's reported to search engines and browsers as the theme background color.
            </FormControl.HelpText>
            <FormControl.Counter />
          </Flex>
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
