import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'visitor' | 'organizer' | 'gate_staff' | 'vendor' | 'admin';
  tenant_id: string;
}

export interface Seat {
  id: string;
  event_id: string;
  row: string;
  number: number;
  category: 'VIP' | 'CAT 1' | 'CAT 2' | 'FESTIVAL';
  price: number;
  status: 'available' | 'locked' | 'sold';
}

interface AppState {
  user: User | null;
  token: string | null;
  selectedSeats: Seat[];
  activeEventId: string | null;
  setUser: (user: User | null, token?: string) => void;
  logout: () => void;
  toggleSeatSelection: (seat: Seat) => void;
  clearSeatSelection: () => void;
  setActiveEventId: (eventId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('wl_token') : null,
  selectedSeats: [],
  activeEventId: null,

  setUser: (user, token) => {
    if (token) {
      localStorage.setItem('wl_token', token);
    }
    set({ user, token: token || localStorage.getItem('wl_token') });
  },

  logout: () => {
    localStorage.removeItem('wl_token');
    set({ user: null, token: null, selectedSeats: [] });
  },

  toggleSeatSelection: (seat) =>
    set((state) => {
      const exists = state.selectedSeats.some((s) => s.id === seat.id);
      if (exists) {
        return { selectedSeats: state.selectedSeats.filter((s) => s.id !== seat.id) };
      } else {
        return { selectedSeats: [...state.selectedSeats, seat] };
      }
    }),

  clearSeatSelection: () => set({ selectedSeats: [] }),
  setActiveEventId: (activeEventId) => set({ activeEventId }),
}));
