export interface VirtualizerOptions {
  count: number;
  estimateSize: number | ((index: number) => number);
  scrollOffset: number;
  viewportSize: number;
  overscan?: number;
}

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  end: number;
}

export interface VirtualizerResult {
  virtualItems: VirtualItem[];
  totalSize: number;
  offsetBefore: number;
  offsetAfter: number;
}

export function getVirtualItems(options: VirtualizerOptions): VirtualizerResult {
  const count = Math.max(0, options.count);
  const overscan = Math.max(0, options.overscan ?? 1);
  const getSize = (index: number) =>
    typeof options.estimateSize === 'function'
      ? options.estimateSize(index)
      : options.estimateSize;
  const sizes = new Array<number>(count);
  let totalSize = 0;

  for (let index = 0; index < count; index += 1) {
    const size = Math.max(0, getSize(index));
    sizes[index] = size;
    totalSize += size;
  }

  const viewportStart = Math.max(0, options.scrollOffset);
  const viewportEnd = viewportStart + Math.max(0, options.viewportSize);
  let startIndex = 0;
  let offsetBefore = 0;

  while (
    startIndex < count &&
    offsetBefore + (sizes[startIndex] ?? 0) < viewportStart
  ) {
    offsetBefore += sizes[startIndex] ?? 0;
    startIndex += 1;
  }

  let endIndex = startIndex;
  let offset = offsetBefore;

  while (endIndex < count && offset < viewportEnd) {
    offset += sizes[endIndex] ?? 0;
    endIndex += 1;
  }

  startIndex = Math.max(0, startIndex - overscan);
  endIndex = Math.min(count, endIndex + overscan);

  let start = 0;
  for (let index = 0; index < startIndex; index += 1) {
    start += sizes[index] ?? 0;
  }

  const virtualItems: VirtualItem[] = [];
  for (let index = startIndex; index < endIndex; index += 1) {
    const size = sizes[index] ?? 0;
    virtualItems.push({
      index,
      start,
      size,
      end: start + size
    });
    start += size;
  }

  const first = virtualItems[0];
  const last = virtualItems[virtualItems.length - 1];

  return {
    virtualItems,
    totalSize,
    offsetBefore: first?.start ?? 0,
    offsetAfter: last ? Math.max(0, totalSize - last.end) : totalSize
  };
}
