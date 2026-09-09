import { create } from "zustand";
import type { UserProfile, Role, Permission } from "../types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { AuthService } from "../services/auth.service";

interface AuthState {
  user: UserProfile | null;
  role: Role | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  setUser: (user: UserProfile | null) => void;
  initialize: () => (() => void);
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => {
    set({
      user,
      role: user?.role || null,
      permissions: user?.permissions || [],
      isAuthenticated: !!user,
    });
  },

  hasPermission: (permission: Permission) => {
    return get().permissions.includes(permission);
  },

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      set({ isLoading: true });
      try {
        if (firebaseUser) {
          const profile = await AuthService.getUserProfile(firebaseUser.uid);
          if (profile) {
            get().setUser(profile);
          } else {
            get().setUser(null);
          }
        } else {
          get().setUser(null);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        get().setUser(null);
      } finally {
        set({ isLoading: false, isInitialized: true });
      }
    });

    return unsubscribe; // allow cleanup if needed
  },
}));
