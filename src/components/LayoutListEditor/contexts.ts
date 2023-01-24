import { createContext } from "react";
import { SortEndHandler, SortStartHandler } from "react-sortable-hoc";
import { Layout, LayoutTypeName } from "../../LayoutTypeDefinitions";

export const LayoutListContext = createContext<{
  items: Layout[];
  isDisabled: boolean;
  setValue: (value: Layout[]) => Promise<unknown>;
  onSortStart: SortStartHandler;
  onSortEnd: SortEndHandler;
  onMove: (oldIndex: number, newIndex: number) => void;
  onCreate: (type: LayoutTypeName, index?: number) => Promise<unknown>;
}>({
  items: [],
  isDisabled: false,
  setValue: () => Promise.resolve(),
  onSortStart: () => {},
  onSortEnd: () => {},
  onMove: () => {},
  onCreate: () => Promise.resolve(),
});

