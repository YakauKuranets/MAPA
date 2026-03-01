import { useMemo, useState } from 'react';

export function usePlaylistState() {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState('');

  const activeItem = useMemo(() => items.find((item) => item.id === activeId) || null, [items, activeId]);

  function addMockItem() {
    const now = Date.now();
    const id = `clip-${now}`;
    const next = {
      id,
      name: `Evidence clip ${items.length + 1}`,
      durationSec: 30 + items.length * 15,
    };
    setItems((prev) => [next, ...prev]);
    setActiveId(id);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setActiveId((prev) => (prev === id ? '' : prev));
  }

  return {
    items,
    activeId,
    activeItem,
    setActiveId,
    addMockItem,
    removeItem,
  };
}
