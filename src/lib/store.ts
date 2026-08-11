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
  isHydrated: boolean;
  selectedSeats: Seat[];
  activeEventId: string | null;
  setUser: (user: User | null, token?: string) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
  toggleSeatSelection: (seat: Seat) => void;
  clearSeatSelection: () => void;
  setActiveEventId: (eventId: string | null) => void;
}

const getInitialUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('wl_user');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const useAppStore = create<AppState>((set) => ({
  user: getInitialUser(),
  token: typeof window !== 'undefined' ? localStorage.getItem('wl_token') : null,
  isHydrated: false,
  selectedSeats: [],
  activeEventId: null,

  setUser: (user, token) => {
    if (token) {
      localStorage.setItem('wl_token', token);
    }
    if (user) {
      localStorage.setItem('wl_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('wl_user');
    }
    set({ user, token: token || localStorage.getItem('wl_token'), isHydrated: true });
  },

  logout: () => {
    localStorage.removeItem('wl_token');
    localStorage.removeItem('wl_user');
    set({ user: null, token: null, selectedSeats: [], isHydrated: true });
  },

  setHydrated: (isHydrated) => set({ isHydrated }),

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

export const isOrganizer = (user: User | null) => user?.role === 'organizer' || user?.role === 'admin';
export const isVisitor = (user: User | null) => user?.role === 'visitor';
export const isGateStaff = (user: User | null) => user?.role === 'gate_staff';


