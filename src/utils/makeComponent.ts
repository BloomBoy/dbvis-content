import { ComponentDef } from '../ComponentTypeDefinitions';

export default function makeComponent<Data>(component: ComponentDef<Data, string>) {
  return component;
}
