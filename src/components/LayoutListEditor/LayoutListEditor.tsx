import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FieldAPI, FieldExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import LayoutActions from './LayoutActions';
import {
  ComponentContainer,
  isLayoutEntity,
  isLayoutEntityType,
  isLayoutLink,
  LayoutContainerDataByTypeName,
  LayoutDataByTypeName,
  LayoutLinks,
  layouts,
  LayoutTypeName,
  LAYOUT_TYPES,
  StoredLayoutData,
  StoredLayoutDataByTypeName,
  StoredLayoutEntity,
} from '../../LayoutTypeDefinitions';
import * as definitionHelpers from '../../utils/definitionHelpers';
import { LayoutEditorCard } from '../LayoutEditor';
import SortableList, { SortableContainerChildProps } from '../SortableList';
import { ContentTypeProps, Entry, Link, SysLink } from 'contentful-management';
import { FetchingWrappedEntryCard } from '../FetchingWrappedEntryCard';
import { EntityProvider } from '@contentful/field-editor-reference';
import throttle from 'lodash/throttle';
import { isComponentLink } from '../../ComponentTypeDefinitions';
import useAllContentTypes from '../../hooks/useAllContentTypes';

function onLinkOrCreate(
  setValue: (value: (StoredLayoutEntity | LayoutLinks)[]) => Promise<unknown>,
  items: (StoredLayoutEntity | LayoutLinks)[],
  types: (LayoutTypeName | LayoutLinks)[],
  index = items.length,
): Promise<unknown> {
  const id = definitionHelpers.getId();
  const newLayouts: (StoredLayoutEntity | LayoutLinks)[] = types
    .map((type) => {
      if (typeof type === 'object') {
        return type;
      }
      const layout = layouts[type];
      const configurableSlotCount =
        definitionHelpers.resolveConfigurableSlotCount(
          layout.configurableSlotCount,
        );
      const slots: ComponentContainer<any>[] = layout.defaultSlots ?? [];
      if (configurableSlotCount !== false) {
        for (let i = slots.length; i < configurableSlotCount[0]; i++) {
          slots.push(definitionHelpers.createSlot(layout));
        }
      }
      return {
        type,
        id,
        slots,
        data: definitionHelpers.getDefaultFieldMap(layout.subFields as any),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
  if (newLayouts.length === 0) {
    return Promise.resolve();
  }
  const newItems = Array.from(items);
  newItems.splice(index, 0, ...newLayouts);
  return setValue(newItems);
}

const emptyArray: never[] = [];

type LinkListEntry = {
  item: LayoutLinks;
  id: string;
  type: 'link';
};

type LayoutlistEntry<
  StoredEntity extends StoredLayoutEntity = StoredLayoutEntity,
> = {
  item: StoredEntity;
  setter(newEntity: StoredEntity): Promise<unknown>;
  id: string;
  type: 'entity';
};

type ListEntry = LinkListEntry | LayoutlistEntry;

function renderInlineLayoutItem<LayoutType extends LayoutTypeName>(
  {
    item: { item, setter },
    index,
    isDisabled,
    DragHandle,
  }: {
    item: LayoutlistEntry<StoredLayoutDataByTypeName<LayoutType>>;
  } & Pick<
    SortableContainerChildProps<ListEntry>,
    'isDisabled' | 'index' | 'DragHandle'
  >,
  {
    value,
    sdk,
    setValue,
  }: {
    sdk: FieldExtensionSDK;
    value: (StoredLayoutEntity | LayoutLinks)[];
    setValue(
      value: (StoredLayoutEntity | LayoutLinks)[],
      forceReferences?: boolean,
    ): Promise<unknown>;
  },
) {
  return (
    <LayoutEditorCard
      isDisabled={isDisabled}
      index={index}
      item={item}
      setValue={setter}
      sdk={sdk}
      key={`${item.type}-${item.id}`}
      onRemove={() =>
        setValue(
          value.filter(({ id }) => id !== item.id),
          true,
        ).then(() => {
          sdk.entry.save();
        })
      }
      renderDragHandle={DragHandle}
    />
  );
}

function RenderLinkedItem(
  {
    item: { item },
    isDisabled,
    DragHandle,
  }: {
    item: LinkListEntry;
  } & Pick<SortableContainerChildProps<ListEntry>, 'isDisabled' | 'DragHandle'>,
  {
    value,
    sdk,
    setValue,
    allContentTypes,
  }: {
    sdk: FieldExtensionSDK;
    value: (StoredLayoutEntity | LayoutLinks)[];
    setValue(
      value: (StoredLayoutEntity | LayoutLinks)[],
      forceReferences?: boolean,
    ): Promise<unknown>;
    allContentTypes: ContentTypeProps[];
  },
) {
  return (
    <FetchingWrappedEntryCard
      key={`${item.target.sys.id}-${item.id}`}
      isInitiallyDisabled={false}
      hasCardEditActions={false}
      sdk={sdk}
      viewType={'link'}
      parameters={{
        instance: {
          showCreateEntityAction: false,
          showLinkEntityAction: true,
          bulkEditing: false,
        },
      }}
      renderDragHandle={DragHandle}
      entryId={item.target.sys.id}
      allContentTypes={allContentTypes}
      isDisabled={isDisabled}
      onRemove={() =>
        setValue(
          value.filter(({ id }) => id !== item.id),
          true,
        ).then(() => {
          sdk.entry.save();
        })
      }
    />
  );
}

function isContentfulLink(val: unknown): val is SysLink {
  if (typeof val !== 'object' || val == null) return false;
  if (!('sys' in val)) return false;
  const { sys } = val as { sys: unknown };
  if (typeof sys !== 'object' || sys == null) return false;
  if (!('type' in sys)) return false;
  if (!('linkType' in sys)) return false;
  if (!('id' in sys)) return false;
  const { type, linkType, id } = sys as {
    [key in 'type' | 'linkType' | 'id']: unknown;
  };
  return (
    typeof type === 'string' &&
    typeof linkType === 'string' &&
    typeof id === 'string'
  );
}

function isLink<T extends string>(val: unknown, type: T): val is Link<T> {
  if (!isContentfulLink(val)) return false;
  return val.sys.linkType === type;
}

const CHECKED = Symbol('checked');

function maybeAddDataId(
  value: unknown,
  entryIds: Set<string>,
  assetIds: Set<string>,
): void {
  if (isLink(value, 'Asset')) {
    assetIds.add(value.sys.id);
  } else if (isLink(value, 'Entry')) {
    entryIds.add(value.sys.id);
  } else if (typeof value === 'object' && value != null) {
    const valWithCheck = (value as { [CHECKED]?: boolean });
    if (valWithCheck[CHECKED]) return;
    if (Array.isArray(value)) {
      valWithCheck[CHECKED] = true;
      value.forEach((item) => maybeAddDataId(item, entryIds, assetIds));
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      valWithCheck[CHECKED] = true;
      Object.values(value).forEach((item) =>
        maybeAddDataId(item, entryIds, assetIds),
      );
    }
  }
}

function updatePageLists(
  value: (StoredLayoutEntity | LayoutLinks)[],
  assetListField: FieldAPI,
  referenceListField: FieldAPI,
) {
  const entryIds = new Set<string>();
  const assetIds = new Set<string>();
  value.forEach((item) => {
    if (isLayoutLink(item)) {
      entryIds.add(item.target.sys.id);
    } else {
      Object.values(item.data).forEach((subFieldData: unknown) => {
        maybeAddDataId(subFieldData, entryIds, assetIds);
      });
      item.slots.forEach((slot) => {
        Object.values(slot.data).forEach((subFieldData: unknown) => {
          maybeAddDataId(subFieldData, entryIds, assetIds);
        });
        slot.components.forEach((component) => {
          if (isComponentLink(component)) {
            entryIds.add(component.sys.id);
          } else {
            Object.values(component.data).forEach((subFieldData: unknown) => {
              maybeAddDataId(subFieldData, entryIds, assetIds);
            });
          }
        });
      });
    }
  });
  const assetList = Array.from(assetIds).sort((a, b) => a.localeCompare(b));
  const referenceList = Array.from(entryIds).sort((a, b) => a.localeCompare(b));
  return Promise.all([
    assetListField.setValue(
      assetList.map(
        (id): Link<'Asset'> => ({
          sys: {
            id,
            linkType: 'Asset',
            type: 'Link',
          },
        }),
      ),
    ),
    referenceListField.setValue(
      referenceList.map(
        (id): Link<'Entry'> => ({
          sys: {
            id,
            linkType: 'Entry',
            type: 'Link',
          },
        }),
      ),
    ),
  ]).then(() => {});
}

export default function LayoutListEditor({
  assetListField,
  referenceListField,
}: {
  assetListField: FieldAPI;
  referenceListField: FieldAPI;
}) {
  const sdk = useSDK<FieldExtensionSDK>();
  const fieldRef = useRef(sdk.field);
  fieldRef.current = sdk.field;
  const [isDisabled, setIsDisabled] = useState(false);
  const [currentValue, setCurrentValue] = useState(
    fieldRef.current.getValue() as
      | (StoredLayoutEntity | LayoutLinks)[]
      | undefined,
  );

  useEffect(() => {
    const unlistenOnValue = sdk.field.onValueChanged((value) => {
      setCurrentValue(
        value as (StoredLayoutEntity | LayoutLinks)[] | undefined,
      );
    });
    const unlistenOnIsDisabled = sdk.field.onIsDisabledChanged((isDisabled) => {
      setIsDisabled(isDisabled);
    });
    return () => {
      unlistenOnValue();
      unlistenOnIsDisabled();
    };
  }, [sdk.field]);

  const assetListFieldRef = useRef(assetListField);
  assetListFieldRef.current = assetListField;
  const referenceListFieldRef = useRef(referenceListField);
  referenceListFieldRef.current = referenceListField;

  const updateReferences = useMemo(
    () =>
      throttle(
        (value: (StoredLayoutEntity | LayoutLinks)[]) =>
          updatePageLists(
            value,
            assetListFieldRef.current,
            referenceListFieldRef.current,
          ),
        1000,
        { leading: true, trailing: true },
      ),
    [],
  );

  const setValue = useCallback(
    (
      value: (StoredLayoutEntity | LayoutLinks)[],
      forceReferences?: boolean,
    ): Promise<unknown> => {
      const referenceRet = forceReferences
        ? Promise.resolve(updateReferences.flush()).then(() =>
            updatePageLists(
              value,
              assetListFieldRef.current,
              referenceListFieldRef.current,
            ),
          )
        : updateReferences(value);
      if (referenceRet == null) return fieldRef.current.setValue(value);
      return Promise.all([referenceRet, fieldRef.current.setValue(value)]).then(
        ([, ret]) => ret,
      );
    },
    [updateReferences],
  );

  const value = Array.isArray(currentValue) ? currentValue : emptyArray;
  const allContentTypes = useAllContentTypes(sdk);

  const onSelect = useCallback(
    (
      type: typeof LAYOUT_TYPES[number] | LayoutLinks['type'],
      index?: number,
    ) => {
      if (isLayoutEntityType(type)) {
        return onLinkOrCreate(
          (val) => setValue(val, true),
          value,
          [type],
          index,
        ).then(() => {
          sdk.entry.save();
        });
      } else {
        const contentType = type.slice(0, -4);
        return sdk.dialogs
          .selectSingleEntry<Entry>({
            contentTypes: [contentType],
            locale: sdk.field.locale,
          })
          .then(
            (res) => {
              if (res == null) return;
              const link: LayoutLinks = {
                id: definitionHelpers.getId(),
                target: {
                  sys: {
                    id: res.sys.id,
                    type: 'Link',
                    linkType: 'Entry',
                  },
                },
                type,
              };
              return onLinkOrCreate(setValue, value, [link], index);
            },
            (err) => console.error(err),
          );
      }
    },
    [setValue, value, sdk.entry, sdk.dialogs, sdk.field.locale],
  );

  const mappedItems = useMemo(
    () =>
      value.map((layout, index) => {
        if (isLayoutEntity(layout)) {
          const layoutProps = {
            item: layout,
            setter(newEntity: StoredLayoutEntity) {
              const newValue = [...value];
              newValue[index] = newEntity;
              return setValue(newValue);
            },
          } as {
            [name in LayoutTypeName]: {
              item: StoredLayoutDataByTypeName<name>;
              setter(
                newEntity: StoredLayoutData<
                  LayoutDataByTypeName<name>,
                  LayoutContainerDataByTypeName<name>,
                  name
                >,
              ): Promise<unknown>;
            };
          }[LayoutTypeName];
          return {
            ...layoutProps,
            id: layout.id,
            type: 'entity' as const,
          };
        } else {
          return {
            item: layout,
            id: layout.id,
            type: 'link' as const,
          };
        }
      }),
    [setValue, value],
  );

  const setListValue = useCallback((newValue: typeof mappedItems) => {
    return fieldRef.current.setValue(newValue.map(({ item }) => item));
  }, []);

  return (
    <EntityProvider sdk={sdk}>
      <SortableList
        items={mappedItems}
        isDisabled={isDisabled}
        setValue={setListValue}
        action={
          <LayoutActions
            addNewLayout={onSelect}
            isFull={false}
            isEmpty={value.length === 0}
          />
        }
      >
        {({
          item,
          ...rest
        }: SortableContainerChildProps<
          | {
              item: LayoutLinks;
              id: string;
              type: 'link';
            }
          | {
              item: StoredLayoutEntity;
              setter(
                newEntity: LayoutLinks | StoredLayoutEntity,
              ): Promise<unknown>;
              id: string;
              type: 'entity';
            }
        >) => {
          if (item.type === 'link') {
            return RenderLinkedItem(
              {
                item,
                isDisabled: rest.isDisabled,
                DragHandle: rest.DragHandle,
              },
              {
                setValue,
                sdk,
                value,
                allContentTypes,
              },
            );
          } else {
            return renderInlineLayoutItem(
              {
                item,
                index: rest.index,
                isDisabled: rest.isDisabled,
                DragHandle: rest.DragHandle,
              },
              {
                setValue,
                sdk,
                value,
              },
            );
          }
        }}
      </SortableList>
    </EntityProvider>
  );
}
