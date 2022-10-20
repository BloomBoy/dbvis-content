import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
} from 'react';

import { Menu, MenuProps } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import isPromiseLike from '../utils/isPromiseLike';

const menuPlacementMap: {
  [key: string]: MenuProps['placement'];
} = {
  'bottom-left': 'bottom-start',
  'bottom-right': 'bottom-end',
};

const styles = {
  wrapper: css({
    position: 'relative',
  }),
  inputWrapper: css({
    position: 'relative',
    padding: `0 ${tokens.spacing2Xs}`,
  }),
  searchInput: css({
    paddingRight: tokens.spacingXl,
    textOverflow: 'ellipsis',
  }),
  searchIcon: css({
    position: 'absolute',
    right: tokens.spacingM,
    top: tokens.spacingS,
    zIndex: Number(tokens.zIndexDefault),
    fill: tokens.gray600,
  }),
  separator: css({
    background: tokens.gray200,
    margin: '10px 0',
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
  props: LayoutActionsMenuTriggerChildProps,
) => React.ReactElement;

type Category<Item> = {
  readonly label: string;
  readonly items: readonly Item[];
};

type ActionsMenuTriggerProps<Item> = {
  onSelect: (LayoutType: Item) => unknown | Promise<unknown>;
  testId?: string;
  dropdownSettings?: {
    isAutoalignmentEnabled?: boolean;
    position: 'bottom-left' | 'bottom-right';
  };
  children: LayoutActionsMenuTriggerChild;
} & (
  | {
      readonly categories: Category<Item>[];
    }
  | {
      readonly label?: string;
      readonly items: readonly Item[];
    }
);

function SinglCategoryMenuTrigger<Item extends { key: string; label: string }>({
  label,
  testId,
  dropdownSettings,
  children,
  items,
  dropdownWidth,
  openMenu,
  closeMenu,
  isOpen,
  handleSelect,
  isSelecting,
  menuListRef,
  wrapperRef,
}: {
  isOpen: boolean;
  isSelecting: boolean;
  handleSelect(item: Item): void;
  openMenu(): void;
  closeMenu(): void;
  dropdownWidth?: number;
  children: LayoutActionsMenuTriggerChild;
  dropdownSettings: {
    isAutoalignmentEnabled?: boolean;
    position: 'bottom-left' | 'bottom-right';
  };
  testId: string;
  label?: string;
  items: readonly Item[];
  wrapperRef?: React.ComponentPropsWithRef<'span'>['ref'];
  menuListRef?: React.ComponentPropsWithRef<typeof Menu.List>['ref'];
}) {
  const hasDropdown = items.length > 1;

  const handleMenuOpen = () => {
    if (hasDropdown) {
      openMenu();
    } else if (items.length > 0) {
      handleSelect(items[0]);
    }
  };

  const maxDropdownHeight = 250;

  if (items.length === 0) return null;

  return (
    <span className={styles.wrapper} ref={wrapperRef} data-test-id={testId}>
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
              width: dropdownWidth != null ? `${dropdownWidth}px` : undefined,
              maxHeight: `${maxDropdownHeight}px`,
            }}
            ref={menuListRef}
            testId="add-entry-menu"
          >
            <Menu.SectionTitle>{label}</Menu.SectionTitle>
            {items.length ? (
              items.map((item, i) => (
                <Menu.Item
                  testId="contentType"
                  key={item.key}
                  onClick={() => handleSelect(item)}
                >
                  {item.label}
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

export default function LayoutActionsMenuTrigger<
  Item extends { key: string; label: string },
>({
  onSelect,
  testId = 'layout-actions-button-menu-trigger',
  dropdownSettings = {
    position: 'bottom-left',
  },
  children,
  ...props
}: ActionsMenuTriggerProps<Item>) {
  const [isOpen, setOpen] = useState(false);
  const [isSelecting, setSelecting] = useState(false);
  const wrapperRef = useRef<any | null>(null);
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

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textField.current
          ?.querySelector('input')
          ?.focus({ preventScroll: true });
      }, 200);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !dropdownWidth) {
      setDropdownWidth(menuListRef.current?.clientWidth);
    }
  }, [isOpen, dropdownWidth]);

  const handleSelect = (item: Item) => {
    closeMenu();
    const res = onSelect(item);

    // TODO: Convert to controllable component.
    if (isPromiseLike(res)) {
      setSelecting(true);
      res.then(
        () => setSelecting(false),
        () => setSelecting(false),
      );
    }
  };

  const openMenu = useCallback(() => {
    setOpen(true);
  }, []);

  const rawCategories = 'categories' in props ? props.categories : undefined;

  const categories = useMemo(
    () => rawCategories?.filter(({ items }) => items.length > 0),
    [rawCategories],
  );

  const maxDropdownHeight = 250;

  if ('items' in props || categories?.length === 1) {
    const { items, label } =
      'items' in props ? props : (categories as typeof props.categories)[0];
    return (
      <SinglCategoryMenuTrigger
        closeMenu={closeMenu}
        dropdownSettings={dropdownSettings}
        handleSelect={handleSelect}
        isSelecting={isSelecting}
        isOpen={isOpen}
        items={items}
        openMenu={openMenu}
        testId={testId}
        dropdownWidth={dropdownWidth}
        label={label}
        menuListRef={menuListRef}
        wrapperRef={wrapperRef}
      >
        {children}
      </SinglCategoryMenuTrigger>
    );
  }

  if (categories == null || categories.length === 0) return null;

  return (
    <span className={styles.wrapper} ref={wrapperRef} data-test-id={testId}>
      <Menu
        placement={menuPlacementMap[dropdownSettings.position]}
        isAutoalignmentEnabled={dropdownSettings.isAutoalignmentEnabled}
        isOpen={isOpen}
        onClose={closeMenu}
        onOpen={openMenu}
      >
        <Menu.Trigger>{children({ isOpen, isSelecting })}</Menu.Trigger>

        {isOpen && (
          <Menu.List
            className={styles.dropdownList}
            style={{
              width: dropdownWidth != null ? `${dropdownWidth}px` : undefined,
              maxHeight: `${maxDropdownHeight}px`,
            }}
            ref={menuListRef}
            testId="add-entry-menu"
          >
            {categories.map(({ label, items }) => (
              <Fragment key={label}>
                <Menu.SectionTitle>{label}</Menu.SectionTitle>
                {items.length ? (
                  items.map((item, i) => (
                    <Menu.Item
                      testId="contentType"
                      key={item.key}
                      onClick={() => handleSelect(item)}
                    >
                      {item.label}
                    </Menu.Item>
                  ))
                ) : (
                  <Menu.Item testId="add-entru-menu-search-results">
                    No results found
                  </Menu.Item>
                )}
              </Fragment>
            ))}
          </Menu.List>
        )}
      </Menu>
    </span>
  );
}
