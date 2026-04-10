export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function paginate(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
