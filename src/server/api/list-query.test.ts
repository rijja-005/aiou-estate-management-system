import { describe, expect, it } from 'vitest';
import { parseListQuery, listMeta } from './list-query';

describe('parseListQuery', () => {
  it('parses defaults', () => {
    const parsed = parseListQuery(new URLSearchParams());
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
    expect(parsed.sort).toBe('createdAt');
    expect(parsed.order).toBe('desc');
  });

  it('parses explicit values', () => {
    const parsed = parseListQuery(
      new URLSearchParams({
        page: '2',
        pageSize: '50',
        sort: 'name',
        order: 'asc',
        search: 'admin block',
        isEnabled: 'false',
      }),
    );

    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(50);
    expect(parsed.sort).toBe('name');
    expect(parsed.order).toBe('asc');
    expect(parsed.search).toBe('admin block');
    expect(parsed.isEnabled).toBe(false);
  });
});

describe('listMeta', () => {
  it('computes page metadata', () => {
    expect(listMeta(51, 2, 20)).toEqual({
      total: 51,
      page: 2,
      pageSize: 20,
      totalPages: 3,
    });
  });
});
