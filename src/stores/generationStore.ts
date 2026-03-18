import { create } from "zustand";
import type { Generation, GenerationParams } from "@/types/generation";

interface GenerationState {
  currentParams: GenerationParams;
  isGenerating: boolean;
  generatedImages: string[];
  currentGeneration: Generation | null;
  recentGenerations: Generation[];

  setParams: (params: Partial<GenerationParams>) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGeneratedImages: (images: string[]) => void;
  setCurrentGeneration: (generation: Generation | null) => void;
  addToRecent: (generation: Generation) => void;
  reset: () => void;
}

const DEFAULT_PARAMS: GenerationParams = {
  style: "simple",
  aspectRatio: "1:1",
  resolution: "1K",
};

export const useGenerationStore = create<GenerationState>((set) => ({
  currentParams: DEFAULT_PARAMS,
  isGenerating: false,
  generatedImages: [],
  currentGeneration: null,
  recentGenerations: [],

  setParams: (params) =>
    set((state) => ({
      currentParams: { ...state.currentParams, ...params },
    })),

  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setGeneratedImages: (images) => set({ generatedImages: images }),

  setCurrentGeneration: (generation) => set({ currentGeneration: generation }),

  addToRecent: (generation) =>
    set((state) => ({
      recentGenerations: [generation, ...state.recentGenerations].slice(0, 20),
    })),

  reset: () =>
    set({
      currentParams: DEFAULT_PARAMS,
      isGenerating: false,
      generatedImages: [],
      currentGeneration: null,
    }),
}));
