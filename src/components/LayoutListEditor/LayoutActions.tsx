import * as styles from './styles';
import { Button } from '@contentful/f36-components';
import { PlusIcon, ChevronDownIcon } from '@contentful/f36-icons';
import {
  LayoutLinks,
  layouts,
  LayoutTypeName,
  LAYOUT_TYPES,
  linkableLayoutTypes,
} from '../../LayoutTypeDefinitions';
import { useCallback, useMemo } from 'react';
import ActionsMenuTrigger from '../ActionsMenuTrigger';

const hasDropdown = LAYOUT_TYPES.length > 1;

export type LayoutActionsProps = {
  addNewLayout: (
    layoutType: typeof LAYOUT_TYPES[number] | LayoutLinks['type'],
  ) => Promise<unknown>;
  isFull: boolean;
  isEmpty: boolean;
};

export default function LayoutActions({
  isFull,
  isEmpty,
  addNewLayout,
}: LayoutActionsProps) {
  const onSelect = useCallback(
    ({ key }: { key: LayoutTypeName | LayoutLinks['type'] }) => {
      return addNewLayout(key);
    },
    [addNewLayout],
  );

  const categories = useMemo<
    {
      label: string;
      readonly items: {
        readonly label: string;
        readonly key: LayoutTypeName | LayoutLinks['type'];
      }[];
    }[]
  >(() => {
    return [
      {
        label: 'Reusable',
        items: linkableLayoutTypes.map<{
          label: string;
          key: LayoutLinks['type'];
        }>((id) => ({
          label: `${id[0].toUpperCase()}${id.slice(1)}`,
          key: `${id}Link`,
        })),
      },
      {
        label: 'New layout',
        items: LAYOUT_TYPES.map((type) => ({
          label: layouts[type].name,
          key: type,
        })),
      },
    ];
  }, []);

  if (isFull) {
    return null; // Don't render link actions if we reached max allowed links.
  }

  // We don't want to render a spacious container in case there are are already
  // assets linked (in case of entries, always show it) as the border wouldn't be
  // nicely aligned with asset cards.
  return (
    <div className={!isEmpty ? '' : styles.container}>
      <ActionsMenuTrigger onSelect={onSelect} categories={categories}>
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
