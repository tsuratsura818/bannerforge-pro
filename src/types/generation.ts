export type GenerationType =
  | "generate"
  | "edit"
  | "remove-bg"
  | "replace-bg"
  | "crop"
  | "upscale"
  | "batch"
  | "remove-object"
  | "multi-size";

export type BannerStyle =
  | "simple"
  | "pop"
  | "luxury"
  | "japanese"
  | "neon"
  | "minimal"
  | "corporate";

export type AspectRatio =
  | "1:1"
  | "9:16"
  | "16:9"
  | "4:3"
  | "3:4"
  | "4:5"
  | "5:4"
  | "21:9";

export type Resolution = "512" | "1K" | "2K" | "4K";

export interface Generation {
  id: string;
  userId: string;
  projectId?: string;
  templateId?: string;
  prompt: string;
  params: GenerationParams;
  inputImages?: string[];
  outputImages: string[];
  model: string;
  resolution?: string;
  aspectRatio?: string;
  generationType: GenerationType;
  processingTimeMs?: number;
  apiCostUsd?: number;
  isFavorite: boolean;
  tags?: string[];
  createdAt: string;
}

export interface GenerationParams {
  style?: BannerStyle;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  templateId?: string;
  [key: string]: unknown;
}

export interface GenerateRequest {
  prompt: string;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
  style?: string;
  templateId?: string;
}

export interface GenerateResponse {
  images: string[];
  processingTime: number;
}
