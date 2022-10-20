import * as styles from '../ComponentEditor/styles';
import { Button } from '@contentful/f36-components';
import { PlusIcon, ChevronDownIcon } from '@contentful/f36-icons';
import { useCallback, useMemo } from 'react';
import ActionsMenuTrigger from '../ActionsMenuTrigger';
import components, { ComponentTypeName, COMPONENT_TYPES } from '../../ComponentTypeDefinitions';

const hasDropdown = COMPONENT_TYPES.length > 1;

export type ComponentActionsProps = {
  addNewComponent: (layoutType: typeof COMPONENT_TYPES[number]) => Promise<unknown>;
  isFull: boolean;
  isEmpty: boolean;
};

export default function ComponentActions({
  isFull,
  isEmpty,
  addNewComponent,
}: ComponentActionsProps) {

  const onSelect = useCallback(({ key }: { key: ComponentTypeName }) => {
    return addNewComponent(key);    
  }, [addNewComponent]);

  const items = useMemo(() => {
    return COMPONENT_TYPES.map((type) => ({
      label: components[type].name ?? type,
      key: type,
    }));
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
        label="Layouts"
        onSelect={onSelect}
        items={items}
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
