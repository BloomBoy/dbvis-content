import { StoredComponentEntity } from '../ComponentTypeDefinitions';
import { FieldExtensionSDK, SerializedJSONValue } from '@contentful/app-sdk';
import React from 'react';
import { FieldMap } from '../shared';

export type AppProps<LayoutData, ContainerData, Type extends string> = {
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
  components: StoredComponentEntity[];
  id: string;
  data: Partial<ContainerData>;
}

export interface LayoutTypeDef<LayoutData, ContainerData, Type extends string> {
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
  Type extends string = string,
> = {
  data: Partial<LayoutData>;
  slots: ComponentContainer<ContainerData>[];
  type: Type;
  id: string;
};

export type FullLayoutProps<
  LayoutData,
  ContainerData,
  Type extends string = string,
> = StoredLayoutData<LayoutData, ContainerData, Type> &
  AppProps<LayoutData, ContainerData, Type>;
