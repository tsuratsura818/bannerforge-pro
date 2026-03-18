export type TemplateCategory =
  | "banner"
  | "product"
  | "ad"
  | "social"
  | "ec"
  | "event";

export interface Template {
  id: string;
  userId?: string;
  name: string;
  category: TemplateCategory;
  subcategory?: string;
  promptTemplate: string;
  defaultParams: Record<string, unknown>;
  thumbnailUrl?: string;
  isPublic: boolean;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}
