import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface VirtualizedListProps {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  threshold?: number;
  filterFn?: (item: T) => boolean;
  emptyMessage?: React.ReactNode;
  loader?: React.ReactNode;
  containerClassName?: string;
  height?: string | number;
  getItemKey?: (item: T, index: number) => string | number;
  isLoading?: boolean;
  className: string;
}

const VirtualizedList = <T,>({
  data,
  renderItem,
  estimateSize = 50,
  overscan = 5,
  hasMore = false,
  onLoadMore,
  threshold = 100,
  filterFn,
  emptyMessage,
  loader = <span>loading...</span>
  isLoading = false,
  containerClassName,
  height = '40vh',
  getItemKey,
  className
}: VirtualizedListProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);

  // Filter data based on search value
  const filteredData = useMemo(() => {
    if (!filterFn) return data;
    return data.filter(item => filterFn(item));
  }, [data, filterFn]);

  // The virtualizer
  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan
  });

  // Reset loading flag when loading completes
  useEffect(() => {
    if (!isLoading) {
      isLoadingMoreRef.current = false;
    }
  }, [isLoading]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !hasMore || isLoading || !onLoadMore || isLoadingMoreRef.current) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;

    if (scrollHeight - scrollTop - clientHeight <= threshold) {
      isLoadingMoreRef.current = true;
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore, threshold]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={twMerge('overflow-auto scrollbar-hide', containerClassName)}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Show loading on initial load */}
      {isLoading && filteredData.length === 0 && loader}

      {/* Show empty state */}
      {!isLoading && filteredData.length === 0 && (emptyMessage || <span>no data found</span>)}

      {/* Virtualized list */}
      {filteredData.length > 0 && (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualItems.map(virtualItem => {
            const item = filteredData[virtualItem.index];
            const key = getItemKey ? getItemKey(item, virtualItem.index) : virtualItem.index;

            return (
              <div
                key={key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`
                }}
                className={className}
              >
                {renderItem(item, virtualItem.index)}
              </div>
            );
          })}
        </div>
      )}

      {/* Show loading on load more */}
      {isLoading && filteredData.length > 0 && loader}
    </div>
  );
};

export default VirtualizedList;
