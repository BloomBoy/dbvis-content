import * as styles from '../ComponentEditor/styles';
import { Button } from '@contentful/f36-components';
import { PlusIcon, ChevronDownIcon } from '@contentful/f36-icons';
import { useCallback, useMemo } from 'react';
import ActionsMenuTrigger from '../ActionsMenuTrigger';
import components, {
  alphabeticalComponentSort,
  ComponentTypeName,
  COMPONENT_GROUPS,
  COMPONENT_TYPES,
} from '../../ComponentTypeDefinitions';
import titleFromKey from '../../utils/titleFromKey';

const hasDropdown = COMPONENT_TYPES.length > 1;

export type ComponentActionsProps = {
  addNewComponent: (
    layoutType: typeof COMPONENT_TYPES[number],
  ) => Promise<unknown>;
  isFull: boolean;
  isEmpty: boolean;
};

export default function ComponentActions({
  isFull,
  isEmpty,
  addNewComponent,
}: ComponentActionsProps) {
  const onSelect = useCallback(
    ({ key }: { key: ComponentTypeName }) => {
      return addNewComponent(key);
    },
    [addNewComponent],
  );

  const categories = useMemo(() => {
    const leftovers = new Set(COMPONENT_TYPES);
    const groups = COMPONENT_GROUPS.map((group) => {
      const items = group.types
        .map((type) => {
          leftovers.delete(type);
          return {
            def: components[type],
            type,
          };
        })
        .sort(group.sort);
      return {
        label: group.name,
        items: items.map(({ type, def }) => ({
          label: def.name || titleFromKey(type),
          key: type,
        })),
      };
    });
    if (leftovers.size > 0) {
      groups.push({
        label: 'Other',
        items: Array.from(leftovers)
          .map((type) => {
            return {
              def: components[type],
              type,
            };
          })
          .sort(alphabeticalComponentSort)
          .map(({ type, def }) => ({
            label: def.name || titleFromKey(type),
            key: type,
          })),
      });
    }
    return groups.filter(({ items }) => items.length > 0);
  }, []);

  if (isFull) {
    return null; // Don't render link actions if we reached max allowed links.
  }

  // We don't want to render a spacious container in case there are are already
  // assets linked (in case of entries, always show it) as the border wouldn't be
  // nicely aligned with asset cards.
  return (
    <div className={!isEmpty ? '' : styles.container}>
      <ActionsMenuTrigger
        label="Components"
        onSelect={onSelect}
        categories={categories}
      >
        {({ isSelecting }) => (
          <Button
            endIcon={hasDropdown ? <ChevronDownIcon /> : undefined}
            variant="secondary"
            className={styles.action}
            startIcon={isSelecting ? undefined : <PlusIcon />}
            size="small"
            isLoading={isSelecting}
          >
            Add Component
          </Button>
        )}
      </ActionsMenuTrigger>
    </div>
  );
}
