import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  previewModalOpen: boolean;
  previewImageUrl: string | null;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openPreview: (imageUrl: string) => void;
  closePreview: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  previewModalOpen: false,
  previewImageUrl: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openPreview: (imageUrl) =>
    set({ previewModalOpen: true, previewImageUrl: imageUrl }),

  closePreview: () =>
    set({ previewModalOpen: false, previewImageUrl: null }),
}));
