import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'visitor' | 'organizer' | 'gate_staff' | 'vendor' | 'admin';
  tenant_id: string;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  quota: number;
  sold: number;
  color: string;
  sort_order: number;
  available?: number;
}

export interface CartItem {
  tier_id: string;
  tier_name: string;
  event_id: string;
  event_name: string;
  unit_price: number;
  quantity: number;
}

interface AppState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  cart: CartItem[];
  activeEventId: string | null;
  setUser: (user: User | null, token?: string) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
  updateCartQuantity: (item: Omit<CartItem, 'quantity'>, delta: number) => void;
  setCartItemQuantity: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  clearCart: () => void;
  setActiveEventId: (eventId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  cart: [],
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
    set({ user: null, token: null, cart: [], isHydrated: true });
  },

  setHydrated: (isHydrated) => set({ isHydrated }),

  updateCartQuantity: (item, delta) =>
    set((state) => {
      const existing = state.cart.find((c) => c.tier_id === item.tier_id);
      if (!existing) {
        if (delta <= 0) return state;
        return { cart: [...state.cart, { ...item, quantity: delta }] };
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return { cart: state.cart.filter((c) => c.tier_id !== item.tier_id) };
      }
      return {
        cart: state.cart.map((c) =>
          c.tier_id === item.tier_id ? { ...c, quantity: newQty } : c
        ),
      };
    }),

  setCartItemQuantity: (item, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((c) => c.tier_id !== item.tier_id) };
      }
      const existing = state.cart.find((c) => c.tier_id === item.tier_id);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.tier_id === item.tier_id ? { ...c, quantity } : c
          ),
        };
      }
      return { cart: [...state.cart, { ...item, quantity }] };
    }),

  clearCart: () => set({ cart: [] }),
  setActiveEventId: (activeEventId) => set({ activeEventId }),
}));

export const isOrganizer = (user: User | null) => user?.role === 'organizer' || user?.role === 'admin';
export const isVisitor = (user: User | null) => user?.role === 'visitor';
export const isGateStaff = (user: User | null) => user?.role === 'gate_staff';
