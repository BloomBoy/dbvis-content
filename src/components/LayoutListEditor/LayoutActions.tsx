import * as styles from './styles';
import { Button } from '@contentful/f36-components';
import { PlusIcon, ChevronDownIcon } from '@contentful/f36-icons';
import { layouts, LayoutTypeName, LAYOUT_TYPES } from '../../LayoutTypeDefinitions';
import { useCallback, useMemo } from 'react';
import ActionsMenuTrigger from '../ActionsMenuTrigger';

const hasDropdown = LAYOUT_TYPES.length > 1;

export type LayoutActionsProps = {
  addNewLayout: (layoutType: typeof LAYOUT_TYPES[number]) => Promise<unknown>;
  isFull: boolean;
  isEmpty: boolean;
};

export default function LayoutActions({
  isFull,
  isEmpty,
  addNewLayout,
}: LayoutActionsProps) {

  const onSelect = useCallback(({ key }: { key: LayoutTypeName }) => {
    return addNewLayout(key);    
  }, [addNewLayout]);

  const items = useMemo(() => {
    return LAYOUT_TYPES.map((type) => ({
      label: layouts[type].name,
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
        layoutTypesLabel="Layouts"
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
            Add Layout
          </Button>
        )}
      </ActionsMenuTrigger>
    </div>
  );
}
