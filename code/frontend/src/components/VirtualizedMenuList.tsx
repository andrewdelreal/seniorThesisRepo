import React, {JSX} from "react";
import { List, RowComponentProps } from "react-window";
import { components, MenuListProps } from "react-select";

const ITEM_HEIGHT = 100;

interface Option {
  value: string;
  label: string;
}

type RowData = {
  items: React.ReactNode[];
};

function Row({ index, style, items }: RowComponentProps<RowData>): JSX.Element {
  return <div style={style}>{items[index]}</div>;
}

export function VirtualizedMenuList<
  OptionType extends Option = Option,
  IsMulti extends boolean = false
>(props: MenuListProps<OptionType, IsMulti>): JSX.Element {
  const { children, maxHeight } = props;

  const items = React.Children.toArray(children);

    const listRef = React.useRef(null);

  return (
    <List
      rowComponent={Row}
      rowCount={items.length}
      rowHeight={ITEM_HEIGHT}
      rowProps={{ items }}
      overscanCount={5}                           // smooth scrolling
      defaultHeight={maxHeight}                  // stable initial layout
      style={{ height: maxHeight, width: "100%" }}
      listRef={listRef}                          // optional future use
    />
  );
}
