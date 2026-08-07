import { z } from 'zod';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().trim().min(1).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(),
  isEnabled: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === 'true';
    }),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export function parseListQuery(searchParams: URLSearchParams): ListQuery {
  return listQuerySchema.parse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    order: searchParams.get('order') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    isEnabled: searchParams.get('isEnabled') ?? undefined,
  });
}

export function listMeta(total: number, page: number, pageSize: number): Record<string, number> {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
