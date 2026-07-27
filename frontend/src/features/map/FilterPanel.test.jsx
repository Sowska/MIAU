import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPanel from './FilterPanel';
import useFilterStore from '../../store/filterStore';

describe('FilterPanel', () => {
  beforeEach(() => {
    // Reset filter store to defaults before each test
    useFilterStore.getState().clearFilters();
  });

  it('renders category checkboxes for mural, graffiti, and sculpture', () => {
    render(<FilterPanel />);
    expect(screen.getByLabelText(/mural/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/graffiti/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sculpture/i)).toBeInTheDocument();
  });

  it('renders author search input', () => {
    render(<FilterPanel />);
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
  });

  it('renders start and end date inputs', () => {
    render(<FilterPanel />);
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('renders a Clear Filters button', () => {
    render(<FilterPanel />);
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('toggles a category into the store when checkbox is checked', () => {
    render(<FilterPanel />);
    const muralCheckbox = screen.getByLabelText(/mural/i);

    fireEvent.click(muralCheckbox);
    expect(useFilterStore.getState().categories).toContain('mural');
  });

  it('removes a category from the store when checkbox is unchecked', () => {
    // Pre-set a category
    useFilterStore.getState().setFilter('categories', ['mural']);

    render(<FilterPanel />);
    const muralCheckbox = screen.getByLabelText(/mural/i);
    expect(muralCheckbox.checked).toBe(true);

    fireEvent.click(muralCheckbox);
    expect(useFilterStore.getState().categories).not.toContain('mural');
  });

  it('updates author filter in the store on input change', () => {
    render(<FilterPanel />);
    const authorInput = screen.getByLabelText(/author/i);

    fireEvent.change(authorInput, { target: { value: 'Banksy' } });
    expect(useFilterStore.getState().author).toBe('Banksy');
  });

  it('updates startDate filter in the store on date input change', () => {
    render(<FilterPanel />);
    const startInput = screen.getByLabelText(/start date/i);

    fireEvent.change(startInput, { target: { value: '2024-01-01' } });
    expect(useFilterStore.getState().startDate).toBe('2024-01-01');
  });

  it('updates endDate filter in the store on date input change', () => {
    render(<FilterPanel />);
    const endInput = screen.getByLabelText(/end date/i);

    fireEvent.change(endInput, { target: { value: '2024-12-31' } });
    expect(useFilterStore.getState().endDate).toBe('2024-12-31');
  });

  it('sets date to null when input is cleared', () => {
    useFilterStore.getState().setFilter('startDate', '2024-01-01');

    render(<FilterPanel />);
    const startInput = screen.getByLabelText(/start date/i);

    fireEvent.change(startInput, { target: { value: '' } });
    expect(useFilterStore.getState().startDate).toBeNull();
  });

  it('clears all filters when Clear Filters is clicked', () => {
    // Set some filters
    useFilterStore.getState().setFilter('categories', ['mural', 'graffiti']);
    useFilterStore.getState().setFilter('author', 'test');
    useFilterStore.getState().setFilter('startDate', '2024-01-01');
    useFilterStore.getState().setFilter('endDate', '2024-12-31');

    render(<FilterPanel />);
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

    const state = useFilterStore.getState();
    expect(state.categories).toEqual([]);
    expect(state.author).toBe('');
    expect(state.startDate).toBeNull();
    expect(state.endDate).toBeNull();
  });

  it('reflects current store state in the UI (synchronization)', () => {
    useFilterStore.getState().setFilter('categories', ['sculpture']);
    useFilterStore.getState().setFilter('author', 'Picasso');
    useFilterStore.getState().setFilter('startDate', '2024-06-01');
    useFilterStore.getState().setFilter('endDate', '2024-06-30');

    render(<FilterPanel />);

    expect(screen.getByLabelText(/sculpture/i).checked).toBe(true);
    expect(screen.getByLabelText(/mural/i).checked).toBe(false);
    expect(screen.getByLabelText(/graffiti/i).checked).toBe(false);
    expect(screen.getByLabelText(/author/i).value).toBe('Picasso');
    expect(screen.getByLabelText(/start date/i).value).toBe('2024-06-01');
    expect(screen.getByLabelText(/end date/i).value).toBe('2024-06-30');
  });

  it('supports selecting multiple categories simultaneously', () => {
    render(<FilterPanel />);

    fireEvent.click(screen.getByLabelText(/mural/i));
    fireEvent.click(screen.getByLabelText(/graffiti/i));

    const categories = useFilterStore.getState().categories;
    expect(categories).toContain('mural');
    expect(categories).toContain('graffiti');
    expect(categories).toHaveLength(2);
  });

  it('has accessible landmark role via aside element', () => {
    render(<FilterPanel />);
    expect(screen.getByRole('complementary', { name: /filter markers/i })).toBeInTheDocument();
  });
});
