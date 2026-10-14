export type MediaFolderNode = {
  /** Full normalized path for this node (e.g. "destinations/europe") */
  path: string;
  /** Segment name for this node (e.g. "europe") */
  name: string;
  children: MediaFolderNode[];
  itemCountDirect: number;
  itemCountTotal: number;
};

export function normalizeFolderPath(input: string | null | undefined): string {
  const raw = (input ?? '').trim();
  if (!raw) return 'library';

  // Normalize to a stable, URL-like path representation.
  const collapsed = raw.replace(/\/{2,}/g, '/');
  const trimmed = collapsed.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed || 'library';
}

export function isInFolderOrDescendant(itemFolder: string, selectedFolder: string): boolean {
  if (itemFolder === selectedFolder) return true;
  return itemFolder.startsWith(selectedFolder + '/');
}

type MutableNode = {
  path: string;
  name: string;
  children: Map<string, MutableNode>;
  itemCountDirect: number;
  itemCountTotal: number;
};

function getOrCreateChild(parent: MutableNode, segment: string): MutableNode {
  const existing = parent.children.get(segment);
  if (existing) return existing;
  const path = parent.path ? `${parent.path}/${segment}` : segment;
  const node: MutableNode = { path, name: segment, children: new Map(), itemCountDirect: 0, itemCountTotal: 0 };
  parent.children.set(segment, node);
  return node;
}

function toSortedNode(node: MutableNode): MediaFolderNode {
  const children = [...node.children.values()].sort((a, b) => a.name.localeCompare(b.name));
  return {
    path: node.path,
    name: node.name,
    itemCountDirect: node.itemCountDirect,
    itemCountTotal: node.itemCountTotal,
    children: children.map(toSortedNode),
  };
}

export function buildMediaFolderTree(folderPaths: string[]): MediaFolderNode[] {
  const root: MutableNode = { path: '', name: '', children: new Map(), itemCountDirect: 0, itemCountTotal: 0 };

  for (const rawPath of folderPaths) {
    const path = normalizeFolderPath(rawPath);
    const segments = path.split('/').filter(Boolean);
    let node = root;
    for (const segment of segments) {
      node = getOrCreateChild(node, segment);
    }
  }

  return [...root.children.values()].sort((a, b) => a.name.localeCompare(b.name)).map(toSortedNode);
}

export function computeFolderCounts(
  tree: MediaFolderNode[],
  folderByItemId: Map<string, string>
): MediaFolderNode[] {
  // Build a path -> node lookup.
  const byPath = new Map<string, MediaFolderNode>();
  const walk = (node: MediaFolderNode) => {
    byPath.set(node.path, node);
    node.children.forEach(walk);
  };
  tree.forEach(walk);

  // Reset counts.
  for (const node of byPath.values()) {
    node.itemCountDirect = 0;
    node.itemCountTotal = 0;
  }

  // Count direct items.
  for (const folder of folderByItemId.values()) {
    const node = byPath.get(folder);
    if (node) node.itemCountDirect += 1;
  }

  // Post-order compute totals.
  const computeTotal = (node: MediaFolderNode): number => {
    const childrenTotal = node.children.reduce((sum, child) => sum + computeTotal(child), 0);
    node.itemCountTotal = node.itemCountDirect + childrenTotal;
    return node.itemCountTotal;
  };
  tree.forEach(computeTotal);

  return tree;
}

