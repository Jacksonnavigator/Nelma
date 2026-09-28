export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN";

export type ApiError = {
  code: ApiErrorCode | string;
  status?: number;
  message: string;
  details?: unknown;
};

export type PaginatedResult<T> = {
  items: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  nextCursor?: string | null;
};