import React, { useState, useRef, useEffect } from "react";

import { Menu, MenuProps } from "@contentful/f36-components";
import tokens from "@contentful/f36-tokens";
import { css } from "emotion";
import get from "lodash/get";
import {
  layouts,
  LayoutTypeName,
  LAYOUT_TYPES,
} from "./LayoutTypeDefinitions";

const menuPlacementMap: {
  [key: string]: MenuProps["placement"];
} = {
  "bottom-left": "bottom-start",
  "bottom-right": "bottom-end",
};

const styles = {
  wrapper: css({
    position: "relative",
  }),
  inputWrapper: css({
    position: "relative",
    padding: `0 ${tokens.spacing2Xs}`,
  }),
  searchInput: css({
    paddingRight: tokens.spacingXl,
    textOverflow: "ellipsis",
  }),
  searchIcon: css({
    position: "absolute",
    right: tokens.spacingM,
    top: tokens.spacingS,
    zIndex: Number(tokens.zIndexDefault),
    fill: tokens.gray600,
  }),
  separator: css({
    background: tokens.gray200,
    margin: "10px 0",
  }),
  dropdownList: css({
    borderColor: tokens.gray200,
  }),
};

type LayoutActionsMenuTriggerChildProps = {
  isOpen: boolean;
  isSelecting: boolean;
};
export type LayoutActionsMenuTriggerChild = (
  props: LayoutActionsMenuTriggerChildProps
) => React.ReactElement;
export type CreateCustomEntryMenuItems = ({
  closeMenu,
}: {
  closeMenu: Function;
}) => React.ReactElement;

interface LayoutActionsMenuTriggerProps {
  layoutTypesLabel?: string;
  onSelect: (LayoutType: typeof LAYOUT_TYPES[number]) => Promise<unknown>;
  testId?: string;
  dropdownSettings?: {
    isAutoalignmentEnabled?: boolean;
    position: "bottom-left" | "bottom-right";
  };
  children: LayoutActionsMenuTriggerChild;
}

export default function LayoutActionsMenuTrigger({
  layoutTypesLabel,
  onSelect,
  testId = "layout-actions-button-menu-trigger",
  dropdownSettings = {
    position: "bottom-left",
  },
  children,
}: LayoutActionsMenuTriggerProps) {
  const [isOpen, setOpen] = useState(false);
  const [isSelecting, setSelecting] = useState(false);
  const wrapper = useRef<any | null>(null);
  const textField = useRef<any | null>(null);
  const menuListRef = useRef<any | null>(null);
  /*
    By default, dropdown wraps it's content, so it's width = the width of the widest item
    During search, menu items change, and so the widest menu item can change
    This leads to menu always changing it's width
    To prevent this, we get the width of the menu item after the first mount of a dropdown (when all the content is displayed)
    And hardcode it through the class name. This way we ensure that even during search the menu will keep that max width
    That it had on initial mount and that fits any menu item in has
  */
  const [dropdownWidth, setDropdownWidth] = useState();

  const hasDropdown = LAYOUT_TYPES.length > 1;

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textField.current
          ?.querySelector("input")
          ?.focus({ preventScroll: true });
      }, 200);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !dropdownWidth) {
      setDropdownWidth(menuListRef.current?.clientWidth);
    }
  }, [isOpen, dropdownWidth]);

  const handleSelect = (item: LayoutTypeName) => {
    closeMenu();
    const res = onSelect(item);

    // TODO: Convert to controllable component.
    if (res && typeof res.then === "function") {
      setSelecting(true);
      res.then(
        () => setSelecting(false),
        () => setSelecting(false)
      );
    }
  };

  const handleMenuOpen = () => {
    if (hasDropdown) {
      setOpen(true);
    } else if (LAYOUT_TYPES.length > 0) {
      handleSelect(LAYOUT_TYPES[0]);
    }
  };

  const maxDropdownHeight = 250;

  return (
    <span className={styles.wrapper} ref={wrapper} data-test-id={testId}>
      <Menu
        placement={menuPlacementMap[dropdownSettings.position]}
        isAutoalignmentEnabled={dropdownSettings.isAutoalignmentEnabled}
        isOpen={isOpen}
        onClose={closeMenu}
        onOpen={handleMenuOpen}
      >
        <Menu.Trigger>{children({ isOpen, isSelecting })}</Menu.Trigger>

        {isOpen && (
          <Menu.List
            className={styles.dropdownList}
            style={{
              width:
                dropdownWidth != null ? `${dropdownWidth}px` : undefined,
              maxHeight: `${maxDropdownHeight}px`,
            }}
            ref={menuListRef}
            testId="add-entry-menu"
          >
            <Menu.SectionTitle>{layoutTypesLabel}</Menu.SectionTitle>
            {LAYOUT_TYPES.length ? (
              LAYOUT_TYPES.map((layoutType, i) => (
                <Menu.Item
                  testId="contentType"
                  key={layoutType}
                  onClick={() =>
                    handleSelect(layoutType)
                  }
                >
                  {get(
                    layouts[layoutType],
                    "name",
                    "Untitled"
                  )}
                </Menu.Item>
              ))
            ) : (
              <Menu.Item testId="add-entru-menu-search-results">
                No results found
              </Menu.Item>
            )}
          </Menu.List>
        )}
      </Menu>
    </span>
  );
}
