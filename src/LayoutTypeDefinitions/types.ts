import { ComponentLink, StoredComponentEntity } from '../ComponentTypeDefinitions';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import React from 'react';
import { FieldMap } from '../shared';
import { Link } from 'contentful-management';

export type AppProps<LayoutData, ContainerData, Type extends `${string}Layout`> = {
  setValue(value: StoredLayoutData<LayoutData, ContainerData, Type>): Promise<unknown>;
  removeValue(): Promise<undefined>;
  definition: LayoutTypeDef<LayoutData, ContainerData, Type>;
  index: number;
  renderDragHandle?(props: {
    drag: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
  }): JSX.Element;
  sdk: FieldExtensionSDK;
};

export interface ComponentContainer<ContainerData> {
  components: (StoredComponentEntity | ComponentLink<string>)[];
  id: string;
  data: Partial<ContainerData>;
}

export interface LayoutTypeDef<LayoutData, ContainerData, Type extends `${string}Layout`> {
  name: string;
  title:
    | keyof LayoutData
    | ((
        props: StoredLayoutData<LayoutData, ContainerData, Type>,
      ) => string | undefined | null);
  subFields: FieldMap<LayoutData>;
  componentContainerName?: [singular: string, plural: string];
  componentContainerFields: FieldMap<ContainerData>;
  componentContainerTitle?:
    | keyof ContainerData
    | ((props: Partial<ContainerData>, index: number) => string);
  configurableSlotCount?: number | boolean | [min: number, max: number];
  defaultSlots?: ComponentContainer<ContainerData>[];
  renderModal?:
    | React.ComponentType<FullLayoutProps<LayoutData, ContainerData, Type>>
    | boolean;
  renderQuickSettings?:
    | React.ComponentType<FullLayoutProps<LayoutData, ContainerData, Type>>
    | boolean;
  renderSlotsEditor?:
    | React.ComponentType<FullLayoutProps<LayoutData, ContainerData, Type>>
    | boolean;
}

export type StoredLayoutData<
  LayoutData,
  ContainerData,
  Type extends `${string}Layout` = `${string}Layout`,
> = {
  data: Partial<LayoutData>;
  slots: ComponentContainer<ContainerData>[];
  type: Type;
  id: string;
};

export type FullLayoutProps<
  LayoutData,
  ContainerData,
  Type extends `${string}Layout` = `${string}Layout`,
> = StoredLayoutData<LayoutData, ContainerData, Type> &
  AppProps<LayoutData, ContainerData, Type>;

export interface LayoutLink<T extends string> {
  type: `${T}Link`;
  id: string;
  target: Link<'Entry'>;
}