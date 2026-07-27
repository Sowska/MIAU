import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import useFilterStore from './filterStore';

describe('filterStore', () => {
  beforeEach(() => {
    act(() => {
      useFilterStore.getState().clearFilters();
    });
  });

  it('starts with default filter values', () => {
    const state = useFilterStore.getState();
    expect(state.categories).toEqual([]);
    expect(state.author).toBe('');
    expect(state.startDate).toBeNull();
    expect(state.endDate).toBeNull();
  });

  it('setFilter updates a single filter field', () => {
    act(() => {
      useFilterStore.getState().setFilter('author', 'banksy');
    });

    expect(useFilterStore.getState().author).toBe('banksy');
    // Other fields remain unchanged
    expect(useFilterStore.getState().categories).toEqual([]);
    expect(useFilterStore.getState().startDate).toBeNull();
    expect(useFilterStore.getState().endDate).toBeNull();
  });

  it('setFilter updates categories', () => {
    act(() => {
      useFilterStore.getState().setFilter('categories', ['mural', 'graffiti']);
    });

    expect(useFilterStore.getState().categories).toEqual(['mural', 'graffiti']);
  });

  it('setFilter updates startDate and endDate', () => {
    act(() => {
      useFilterStore.getState().setFilter('startDate', '2024-01-01');
    });
    act(() => {
      useFilterStore.getState().setFilter('endDate', '2024-12-31');
    });

    expect(useFilterStore.getState().startDate).toBe('2024-01-01');
    expect(useFilterStore.getState().endDate).toBe('2024-12-31');
  });

  it('clearFilters resets all fields to defaults', () => {
    // Set some filters
    act(() => {
      useFilterStore.getState().setFilter('categories', ['sculpture']);
      useFilterStore.getState().setFilter('author', 'someone');
      useFilterStore.getState().setFilter('startDate', '2023-06-01');
      useFilterStore.getState().setFilter('endDate', '2023-12-31');
    });

    act(() => {
      useFilterStore.getState().clearFilters();
    });

    const state = useFilterStore.getState();
    expect(state.categories).toEqual([]);
    expect(state.author).toBe('');
    expect(state.startDate).toBeNull();
    expect(state.endDate).toBeNull();
  });
});
