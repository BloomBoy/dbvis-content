import React from 'react';
import {
  SortableContainer,
  SortableContainerProps,
  SortableElement,
  SortableHandle,
} from 'react-sortable-hoc';

import tokens from '@contentful/f36-tokens';
import { css, cx } from 'emotion';
import { StoredLayoutEntity } from './LayoutTypeDefinitions';

const styles = {
  container: css({
    position: 'relative',
  }),
  item: css({
    marginBottom: tokens.spacingM,
  }),
};
type SortableContainerChildProps<IType> = Pick<
  SortableLinkListProps<IType>,
  'items' | 'isDisabled'
> & {
  item: IType;
  index: number;
  DragHandle?: typeof DragHandle;
};

type SortableLinkListProps<T> = {
  items: T[];
  isDisabled: boolean;
  children: (props: SortableContainerChildProps<T>) => React.ReactNode;

  className?: string;
};

const DragHandle = (props: { drag: React.ReactElement }) => {
  const SortableDragHandle = SortableHandle(() => props.drag);
  return <SortableDragHandle />;
};

const SortableLayout = SortableElement<{children?: React.ReactNode}>((props: { children?: React.ReactNode }) => (
  <div className={styles.item}>{props.children}</div>
));

const SortableLayoutListInternal = SortableContainer<SortableLinkListProps<any>>((props: SortableLinkListProps<StoredLayoutEntity>) => {
  return (
    <div className={cx(styles.container, props.className)}>
      {props.items.map((item, index) => (
        <SortableLayout
          disabled={props.isDisabled}
          key={`${item.type}-${item.id}`}
          index={index}>
          {props.children({
            items: props.items,
            isDisabled: props.isDisabled,
            item,
            index,
            DragHandle: props.isDisabled ? undefined : DragHandle,
          })}
        </SortableLayout>
      ))}
    </div>
  );
});

// HOC does not support generics, so we mimic it via additional component
export default function SortableLayoutList<T>(props: SortableLinkListProps<T> & SortableContainerProps) {
  // with the default distance of 0 the drag start event is "confused" with the click event,
  // so the latter one isn't fired and click handlers on child elements don't work
  return (
    <SortableLayoutListInternal distance={1} {...props}>
      {props.children}
    </SortableLayoutListInternal>
  );
}