import type { Drawing, Collection, DrawingSummary } from "../types";
import { normalizePreviewSvg } from "../utils/previewSvg";

export const API_URL = "/api";
export type DrawingSortField = "updatedAt" | "createdAt" | "name";
export type SortDirection = "asc" | "desc";

export const axios = {} as any;
export const isAxiosError = (err?: any) => false;

type UpdateChannel = "stable" | "prerelease";
export const getUpdateInfo = async (channel: UpdateChannel) => ({
  currentVersion: "1.0", channel, outboundEnabled: false, latestVersion: null, latestUrl: null, publishedAt: null, isUpdateAvailable: false
});

export const fetchCsrfToken = async () => {};
export const clearCsrfToken = () => {};

export const authStatus = async () => ({ authEnabled: false });
export const startOidcSignIn = () => {};
export const authMe = async () => ({ user: { id: "1", email: "local@local", name: "Local User" } });
export const authRefresh = async () => {};
export const authLogout = async () => {};
export const authLogin = async () => ({ user: { id: "1", email: "local@local", name: "Local User" } });
export const authRegister = async () => ({ user: { id: "1", email: "local@local", name: "Local User" } });
export const authOnboardingChoice = async () => ({ authEnabled: false, authOnboardingCompleted: true, bootstrapRequired: false });
export const authPasswordResetConfirm = async () => {};

// --- LOCAL STORAGE LOGIC ---
const getStorage = <T>(key: string, def: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; }
  catch { return def; }
};
const setStorage = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

export async function getDrawings(search?: string, collectionId?: string | null, options?: any): Promise<any> {
  let drawings = getStorage<Drawing[]>("excalidash_drawings", []);
  if (search) drawings = drawings.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  if (collectionId !== undefined) {
    drawings = drawings.filter(d => (collectionId === null ? d.collectionId === null : d.collectionId === collectionId));
  }
  if (options?.sortField) {
    drawings.sort((a: any, b: any) => {
      const aVal = a[options.sortField];
      const bVal = b[options.sortField];
      const mod = options.sortDirection === 'desc' ? -1 : 1;
      return aVal < bVal ? -mod : aVal > bVal ? mod : 0;
    });
  }
  return { drawings: drawings.map(d => ({...d, preview: d.preview ? normalizePreviewSvg(d.preview as string) : d.preview})), totalCount: drawings.length };
}

export async function getSharedDrawings(_search?: string, _options?: any) { return { drawings: [], totalCount: 0 }; }

export const getDrawing = async (id: string) => {
  const drawings = getStorage<Drawing[]>("excalidash_drawings", []);
  const d = drawings.find(d => d.id === id);
  if (!d) throw new Error("Not found");
  return d;
};

export const resolveShareUsers = async () => [];
export const getDrawingSharing = async () => ({ permissions: [], linkShares: [] });
export const upsertDrawingPermission = async () => ({ permission: {} as any });
export const revokeDrawingPermission = async () => ({ success: true as const });
export const createLinkShare = async () => ({ share: {} as any });
export const revokeLinkShare = async () => ({ success: true as const });

export const createDrawing = async (name?: string, collectionId?: string | null) => {
  const drawings = getStorage<Drawing[]>("excalidash_drawings", []);
  const id = crypto.randomUUID();
  const newDrawing: Drawing = {
    id, name: name || "Untitled Drawing", collectionId: collectionId ?? null,
    elements: [], appState: {}, createdAt: Date.now(), updatedAt: Date.now(), files: {}, version: 1
  };
  drawings.push(newDrawing);
  setStorage("excalidash_drawings", drawings);
  return { id };
};

export const updateDrawing = async (id: string, data: Partial<Drawing>) => {
  const drawings = getStorage<Drawing[]>("excalidash_drawings", []);
  const idx = drawings.findIndex(d => d.id === id);
  if (idx > -1) {
    drawings[idx] = { ...drawings[idx], ...data, updatedAt: Date.now() } as Drawing;
    setStorage("excalidash_drawings", drawings);
    return drawings[idx];
  }
  throw new Error("Not found");
};

export const deleteDrawing = async (id: string) => {
  let drawings = getStorage<Drawing[]>("excalidash_drawings", []);
  drawings = drawings.filter(d => d.id !== id);
  setStorage("excalidash_drawings", drawings);
  return { success: true };
};

export const duplicateDrawing = async (id: string) => {
  const drawings = getStorage<Drawing[]>("excalidash_drawings", []);
  const idx = drawings.findIndex(d => d.id === id);
  if (idx > -1) {
    const d = { ...drawings[idx], id: crypto.randomUUID(), name: drawings[idx].name + " (Copy)", createdAt: Date.now(), updatedAt: Date.now() };
    drawings.push(d);
    setStorage("excalidash_drawings", drawings);
    return d;
  }
  throw new Error("Not found");
};

export const getCollections = async () => getStorage<Collection[]>("excalidash_collections", []);

export const createCollection = async (name: string) => {
  const collections = getStorage<Collection[]>("excalidash_collections", []);
  const c = { id: crypto.randomUUID(), name, createdAt: Date.now(), updatedAt: Date.now() };
  collections.push(c);
  setStorage("excalidash_collections", collections);
  return c;
};

export const updateCollection = async (id: string, name: string) => {
  const collections = getStorage<Collection[]>("excalidash_collections", []);
  const idx = collections.findIndex(c => c.id === id);
  if (idx > -1) {
    collections[idx].name = name;
    setStorage("excalidash_collections", collections);
    return { success: true };
  }
  throw new Error("Not found");
};

export const deleteCollection = async (id: string) => {
  let collections = getStorage<Collection[]>("excalidash_collections", []);
  collections = collections.filter(c => c.id !== id);
  setStorage("excalidash_collections", collections);
  return { success: true };
};

export const getLibrary = async () => [];
export const updateLibrary = async (items: any) => items;

export const api: any = {
  get: async <T>(url: string, config?: any) => {
    if (url === "/collections") return { data: await getCollections() };
    if (url === "/drawings") return { data: (await getDrawings()).drawings };
    return { data: [] as unknown as T };
  },
  post: async <T>(url: string, data?: any, config?: any) => {
    if (url === "/collections") return { data: await createCollection(data?.name) };
    if (url === "/drawings") {
      const { id } = await createDrawing(data?.name, data?.collectionId);
      const updated = await updateDrawing(id, { 
        elements: data?.elements,
        appState: data?.appState,
        files: data?.files,
        preview: data?.preview,
        createdAt: data?.createdAt,
        updatedAt: data?.updatedAt
      });
      return { data: updated };
    }
    return { data: {} as unknown as T };
  },
  patch: async <T>(url: string, data?: any, config?: any) => ({ data: {} as unknown as T }),
  delete: async <T>(url: string, config?: any) => ({ data: {} as unknown as T })
};
