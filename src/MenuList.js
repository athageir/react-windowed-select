import {
  createGetHeight,
  flattenGroupedChildren,
  getCurrentIndex,
  sum,
} from './util';

import React, { forwardRef, useRef, useMemo, useEffect, useLayoutEffect, useState } from 'react';
import { VariableSizeList as List } from 'react-window';

function MenuItem(
  {
    data,
    index,
    setMenuItemHeight,
}) {
  const ref = useRef();

  // using useLayoutEffect prevents bounciness of options of re-renders
  useLayoutEffect(() => {
    if (ref.current) {
      setMenuItemHeight({index, size: ref.current.getBoundingClientRect().height });
    }
  }, [ref.current]);

  return (
    <div 
      key={`option-${index}`} 
      ref={ref}
    >
      {data}
    </div>
  );
}

function MenuList (props) {

  // create local state for measured heights
  const [menuItemHeights, setMenuItemHeights] = useState({});
  useEffect(() => {
    setMenuItemHeights({});
  }, [props.children] );


  const children = useMemo(
    () => {
      const children = React.Children.toArray(props.children);

      const head = children[0] || {};
      const {
        props: {
          data: {
            options = []
          } = {},
        } = {},
      } = head;
      const groupedChildrenLength = options.length;
      const isGrouped = groupedChildrenLength > 0;
      const flattenedChildren = isGrouped && flattenGroupedChildren(children);

      return isGrouped
        ? flattenedChildren
        : children;
    },
    [props.children]
  );

  const { getStyles } = props;
  const groupHeadingStyles = getStyles('groupHeading', props);
  const loadingMsgStyles = getStyles('loadingMessage', props);
  const noOptionsMsgStyles = getStyles('noOptionsMessage', props);
  const optionStyles = getStyles('option', props);
  const getHeight = createGetHeight({
    groupHeadingStyles,
    noOptionsMsgStyles,
    optionStyles,
    loadingMsgStyles,
  });

  const heights = useMemo(() => children.map(getHeight), [children]);
  const currentIndex = useMemo(() => getCurrentIndex(children), [children]);

  const itemCount = children.length;

  // calc menu height
  const { maxHeight, paddingBottom = 0, paddingTop = 0, ...menuListStyle } = getStyles('menuList', props);
  const totalHeight = useMemo(() => heights.reduce(sum, 0), [heights]);
  const totalMenuHeight = totalHeight + paddingBottom + paddingTop;
  const menuHeight = Math.min(maxHeight, totalMenuHeight);
  const estimatedItemSize = Math.floor(totalHeight / itemCount);

  const {
    innerRef,
    selectProps,
  } = props;

  const { classNamePrefix, isMulti } = selectProps || {};
  const list = useRef(null);

  // method to pass to inner item to set this items outer height
  const setSizeItemSize = ({index, size}) => {
    if (menuItemHeights[index] && menuItemHeights[index] === size) return;

    setMenuItemHeights({
      ...menuItemHeights,
      [index]: size
    });

    // this forces the list to rerender items after the item positions resizing
    if (list.current)
      list.current.resetAfterIndex(index);
  };

  useEffect(
    () => {
      /**
       * enables scrolling on key down arrow
       */
      if (currentIndex >= 0 && list.current !== null) {
        list.current.scrollToItem(currentIndex);
      }
    },
    [currentIndex, children, list]
  );

  return (
    <List
      className={classNamePrefix ? `${classNamePrefix}__menu-list${isMulti ? ` ${classNamePrefix}__menu-list--is-multi`: ''}` : ''}
      style={menuListStyle}
      ref={list}
      outerRef={innerRef}
      estimatedItemSize={estimatedItemSize}
      innerElementType={forwardRef(({ style, ...rest }, ref) => (
        <div
          ref={ref}
          style={{
            ...style,
            height: `${ parseFloat(style.height) + paddingBottom + paddingTop }px`
          }}
          {...rest}
        />
      ))}
      height={menuHeight}
      itemCount={itemCount}
      itemData={children}
      itemSize={index => menuItemHeights[index] || heights[index]}
    >
    {({ data, index, style}) => (
      <div
        style={{
          ...style,
          top: `${parseFloat(style.top) + paddingTop}px`,
        }}>
        <MenuItem
          data={data[index]} 
          index={index}  
          setMenuItemHeight={setSizeItemSize}
        />
      </div>
    )}
    </List>
  );
}
export default MenuList;
