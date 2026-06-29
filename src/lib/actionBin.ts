// Lightweight client-side "Action Bin" — items the user flagged as "Not Me"
// and wants to take action on later. Persists in localStorage per browser.

export type ActionBinItem = {
  id: string;            // mention id (or generated)
  url: string;
  title: string;
  platform: string;      // e.g. "Web Mention", "Twitter"
  foundAt: string;       // ISO date
  addedAt: string;       // ISO date
  thumbnailUrl?: string;
};

const KEY = "cmf_action_bin_v1";

const read = (): ActionBinItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (items: ActionBinItem[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("cmf:action-bin-changed"));
  } catch {
    /* ignore quota */
  }
};

export const getActionBin = (): ActionBinItem[] => read();

export const addToActionBin = (item: ActionBinItem): boolean => {
  const items = read();
  if (items.some((i) => i.id === item.id || (i.url && i.url === item.url))) {
    return false;
  }
  items.unshift({ ...item, addedAt: new Date().toISOString() });
  write(items);
  return true;
};

export const removeFromActionBin = (id: string) => {
  write(read().filter((i) => i.id !== id && i.url !== id));
};

export const clearActionBin = () => write([]);

export const isInActionBin = (idOrUrl: string): boolean =>
  read().some((i) => i.id === idOrUrl || i.url === idOrUrl);

export const subscribeActionBin = (cb: () => void): (() => void) => {
  const handler = () => cb();
  window.addEventListener("cmf:action-bin-changed", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("cmf:action-bin-changed", handler);
    window.removeEventListener("storage", handler);
  };
};
