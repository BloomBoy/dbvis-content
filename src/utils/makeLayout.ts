import { LayoutTypeDef } from '../LayoutTypeDefinitions';

export default function makeLayout<LayoutData, ContainerData>(
  opts: LayoutTypeDef<LayoutData, ContainerData, `${string}Layout`>,
) {
  return opts;
}
