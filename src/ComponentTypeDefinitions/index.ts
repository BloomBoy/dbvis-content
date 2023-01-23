import { FieldExtensionSDK } from '@contentful/app-sdk';
import { Link } from 'contentful-management';
import { FieldMap } from '../shared';
import titleFromKey from '../utils/titleFromKey';
import * as rawComponents from './components';

export type StoredComponentData<
  ComponentData,
  Type extends `${string}Component`,
> = {
  id: string;
  type: Type;
  data: Partial<ComponentData>;
};

export type ComponentDef<Data, Type extends `${string}Component`> = {
  name?: string;
  title?:
    | keyof Data
    | ((props: StoredComponentData<Data, Type>) => string | undefined | null);
  subFields: FieldMap<Data>;
  renderEditor?: React.ComponentType<FullComponentProps<Data, Type>> | boolean;
};

function configureComponents<
  T extends {
    [key in `${string}Component`]: any;
  },
>(component: T) {
  return component as unknown as {
    [key in keyof T & `${string}Component`]: T[key] extends ComponentDef<
      infer Data,
      `${string}Component`
    >
      ? ComponentDef<Data, key>
      : T[key];
  };
}

export type AppProps<Data, Type extends `${string}Component`> = {
  setValue(value: StoredComponentData<Data, Type>): Promise<unknown>;
  removeValue(): Promise<undefined>;
  index: number;
  definition: ComponentDef<Data, Type>;
  baseId: string;
  renderDragHandle?(props: {
    drag: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  }): JSX.Element;
  sdk: FieldExtensionSDK;
};

export type FullComponentProps<
  Data,
  Type extends `${string}Component` = `${string}Component`,
> = StoredComponentData<Data, Type> & AppProps<Data, Type>;

export interface ComponentLink<T extends string> extends Link<'Entry'> {
  type: `${T}Link`;
  id: string;
}

const components = configureComponents(rawComponents);

export default components;

export type ComponentStoredDataMap = {
  [key in keyof typeof components]: typeof components[key] extends ComponentDef<
    infer Data,
    key
  >
    ? StoredComponentData<Data, key>
    : never;
};

export type ComponentDataMap = {
  [key in keyof typeof components]: typeof components[key] extends ComponentDef<
    infer Data,
    key
  >
    ? Data
    : never;
};

export type ComponentTypeName = keyof typeof components;

export const COMPONENT_TYPES = Object.keys(components) as ComponentTypeName[];

export type ComponentGroup = {
  name: string;
  sort: <
    T extends {
      def: ComponentDef<any, any>;
      type: string;
    },
  >(
    a: T,
    b: T,
  ) => number;
  types: ComponentTypeName[];
};

export const alphabeticalComponentSort: ComponentGroup['sort'] = (a, b) => {
  const nameA = a.def.name || titleFromKey(a.type);
  const nameB = b.def.name || titleFromKey(b.type);
  return nameA.localeCompare(nameB);
};

export const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    name: 'Manual content',
    sort: alphabeticalComponentSort,
    types: [
      'buttonComponent',
      'textComponent',
      'badgeComponent',
      'imageComponent',
      'titleComponent',
      'imageButtonComponent',
    ],
  },
  {
    name: 'Injected content',
    sort: alphabeticalComponentSort,
    types: [
      'databaseSearchComponent',
      'downloadButtonComponent',
      'emailSignupFormComponent',
      'layoutTitleComponent',
      'reviewSourcesComponent',
      'userReviewsComponent',
    ],
  },
  {
    name: 'Release Components',
    sort: alphabeticalComponentSort,
    types: [
      'allInstallersComponent',
      'recommendedInstallersComponent',
      'releasenotesComponent',
      'releaseQuickLinksComponent',
      'installationInstructionsComponent',
      'versionSelectorComponent',
      'systemRequirementsComponent',
    ],
  },
];

export type ComponentDataByTypeName<Type extends ComponentTypeName> =
  typeof components[Type] extends ComponentDef<infer Data, Type> ? Data : never;

export type ComonentDataEntity = ComponentDataByTypeName<ComponentTypeName>;

export type StoredComponentDataByTypeName<
  ComponentName extends ComponentTypeName,
> = ComponentStoredDataMap[ComponentName];

export type StoredComponentEntity =
  StoredComponentDataByTypeName<ComponentTypeName>;

export function isComponentLinkType(type: string): type is `${string}Link` {
  return type.endsWith('Link');
}

export function isComponentEntityType(
  type: string,
): type is `${string}Component` {
  return type.endsWith('Component');
}

export function isComponentLink(
  link:
    | ComponentLink<string>
    | StoredComponentData<unknown, `${string}Component`>,
): link is ComponentLink<string> {
  return isComponentLinkType(link.type);
}

export function isComponentEntity(component: {
  type: string;
}): component is typeof component & { type: `${string}Component` } {
  return isComponentEntityType(component.type);
}
