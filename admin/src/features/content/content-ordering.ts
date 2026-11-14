export function moveContentItem<Item>(
  items: readonly Item[],
  from: number,
  to: number,
): Item[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return [...items];
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(from, 1);
  nextItems.splice(to, 0, item);
  return nextItems;
}
