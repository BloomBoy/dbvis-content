import * as styles from "./styles";
import { Button } from "@contentful/f36-components";
import { PlusIcon, ChevronDownIcon } from "@contentful/f36-icons";
import LayoutActionsMenuTrigger from "./LayoutActionsMenuTrigger";
import { LAYOUT_TYPES } from './LayoutTypeDefinitions';

const hasDropdown = LAYOUT_TYPES.length > 1;

export type LayoutActionsProps = {
  addNewLayout: (layoutType: typeof LAYOUT_TYPES[number]) => Promise<unknown>;
  isFull: boolean;
  isEmpty: boolean;
}

export default function LayoutActions({
  isFull,
  isEmpty,
  addNewLayout,
}: LayoutActionsProps) {
  if (isFull) {
    return null; // Don't render link actions if we reached max allowed links.
  }
  // We don't want to render a spacious container in case there are are already
  // assets linked (in case of entries, always show it) as the border wouldn't be
  // nicely aligned with asset cards.
  return (
    <div className={!isEmpty ? '' : styles.container}>
          <LayoutActionsMenuTrigger
      onSelect={addNewLayout}
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
    </LayoutActionsMenuTrigger>
    </div>
  );
}
