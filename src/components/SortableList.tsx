import arrayMove from 'array-move';
import React, { useCallback } from 'react';
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
  SortEndHandler,
  SortStartHandler,
} from 'react-sortable-hoc';

import tokens from '@contentful/f36-tokens';
import { css, cx } from 'emotion';

const styles = {
  container: css({
    position: 'relative',
  }),
  item: css({
    marginBottom: tokens.spacingM,
  }),
};
export type SortableContainerChildProps<IType> = Pick<
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

const Sortable = SortableElement<{ children?: React.ReactNode }>(
  (props: { children?: React.ReactNode }) => (
    <div className={styles.item}>{props.children}</div>
  ),
);

const SortableListInternal = SortableContainer<SortableLinkListProps<any>>(
  (props: SortableLinkListProps<{ id: string }>) => {
    return (
      <div className={cx(styles.container, props.className)}>
        {props.items.map((item, index) => (
          <Sortable disabled={props.isDisabled} key={item.id} index={index}>
            {props.children({
              items: props.items,
              isDisabled: props.isDisabled,
              item,
              index,
              DragHandle: props.isDisabled ? undefined : DragHandle,
            })}
          </Sortable>
        ))}
      </div>
    );
  },
);

type EditorProps<T extends { id: string }> = {
  items: T[];
  isDisabled: boolean;
  setValue: (value: T[]) => Promise<unknown>;
  setImmediateValue: (value: T[]) => Promise<unknown>;
  action?: React.ReactNode;
  children: (props: SortableContainerChildProps<T>) => React.ReactNode;
};

export default function SortableList<T extends { id: string }>({
  setImmediateValue,
  action,
  children,
  ...props
}: EditorProps<T>) {
  const { items } = props;

  const onSortStart: SortStartHandler = useCallback(
    (_, event) => event.preventDefault(),
    [],
  );
  const onSortEnd: SortEndHandler = useCallback(
    ({ oldIndex, newIndex }) => {
      const newItems = arrayMove(items, oldIndex, newIndex);
      setImmediateValue(newItems);
    },
    [items, setImmediateValue],
  );

  return (
    <>
      <SortableListInternal
        distance={1}
        {...props}
        onSortStart={onSortStart}
        onSortEnd={onSortEnd}
      >
        {children}
      </SortableListInternal>
      {action}
    </>
  );
}
