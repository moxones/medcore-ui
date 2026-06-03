export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface PageRequest {
  page?: number;
  size?: number;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export function springPageToPaged<T>(page: SpringPage<T>): PagedResponse<T> {
  return {
    content: page.content,
    pageNumber: page.number,
    pageSize: page.size,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    last: page.last,
  };
}
