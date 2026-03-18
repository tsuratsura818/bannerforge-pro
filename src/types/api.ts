export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface SizePreset {
  id?: string;
  platform: string;
  name: string;
  width: number;
  height: number;
  aspectRatio?: string;
  isSystem?: boolean;
}
