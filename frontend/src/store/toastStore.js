import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set, get) => ({
  toasts: [],

  /**
   * Add a toast notification.
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {string} message
   * @param {number} [duration=3000] — auto-dismiss duration in ms
   */
  addToast: (type, message, duration = 3000) => {
    const id = ++toastId;
    const toast = { id, type, message, duration, createdAt: Date.now() };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => set({ toasts: [] }),
}));

export default useToastStore;
