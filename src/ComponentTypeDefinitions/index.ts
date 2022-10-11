import { FieldExtensionSDK, SerializedJSONValue } from "@contentful/app-sdk";
import { FieldMap } from "../LayoutTypeDefinitions";
import * as rawComponents from './components';

export type StoredComponentData<ComponentData, Type> = {
  id: string;
  type: Type;
  data: Partial<ComponentData>;
};

export type ComponentDef<Data, Type extends string> = {
  name?: string;
  title?:
    | keyof Data
    | ((
        props: StoredComponentData<Data, Type>,
      ) => string | undefined | null);
  subFields: FieldMap<Data>;
  renderEditor?:
    | React.ComponentType<FullComponentProps<Data, Type>>
    | boolean;
}

function configureComponents<T extends {
  [key: string]: any;
}>(component: T) {
  return component as unknown as {
    [key in keyof T & string]: T[key] extends ComponentDef<infer Data, string> ? ComponentDef<Data, key> : T[key];
   };
}

export type AppProps<Data, Type extends string> = {
  setValue(value: StoredComponentData<Data, Type>): Promise<SerializedJSONValue | undefined>;
  setImmediateValue(value: StoredComponentData<Data, Type>): Promise<SerializedJSONValue | undefined>;
  removeValue(): Promise<undefined>;
  index: number;
  definition: ComponentDef<Data, Type>;
  id: string;
  renderDragHandle?(props: {
    drag: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  }): JSX.Element;
  sdk: FieldExtensionSDK;
};

export type FullComponentProps<
  Data,
  Type extends string = string,
> = StoredComponentData<Data, Type> &
  AppProps<Data, Type>;

const components = configureComponents(rawComponents);

export default components

export type ComponentStoredDataMap = {
  [key in keyof typeof components]: typeof components[key] extends ComponentDef<infer Data, key> ? StoredComponentData<Data, key> : never;
};

export type ComponentDataMap = {
  [key in keyof typeof components]: typeof components[key] extends ComponentDef<infer Data, key> ? Data : never;
}

export type ComponentTypeName = keyof typeof components;

export const COMPONENT_TYPES = Object.keys(components) as ComponentTypeName[];

export type ComponentDataByTypeName<Type extends ComponentTypeName> = typeof components[Type] extends ComponentDef<infer Data, Type> ? Data : never;

export type ComonentDataEntity = ComponentDataByTypeName<ComponentTypeName>;

export type StoredComponentDataByTypeName<ComponentName extends ComponentTypeName> = ComponentStoredDataMap[ComponentName];

export type StoredComponentEntity = StoredComponentDataByTypeName<ComponentTypeName>;
