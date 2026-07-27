import { create } from 'zustand';

const useFilterStore = create((set) => ({
  categories: [],
  author: '',
  startDate: null,
  endDate: null,

  setFilter: (field, value) => set({ [field]: value }),

  clearFilters: () =>
    set({ categories: [], author: '', startDate: null, endDate: null }),
}));

export default useFilterStore;
