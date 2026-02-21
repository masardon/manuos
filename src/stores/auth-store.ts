import { create } from 'zustand'

export interface User {
  id: string
  email: string
  name?: string
  phone?: string
  roleId: string
  role: string
  roleCode: string
  tenantId: string
  avatarUrl?: string
  employeeId?: string
  isActive: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    // Clear any stored session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('manuos-user')
    }
    set({ user: null, isAuthenticated: false })
  },
}))

// Persist user to localStorage
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('manuos-user')
  if (stored) {
    try {
      const user = JSON.parse(stored)
      useAuthStore.getState().setUser(user)
    } catch (e) {
      localStorage.removeItem('manuos-user')
    }
  }
}

// Subscribe to changes and persist
useAuthStore.subscribe((state) => {
  if (typeof window !== 'undefined') {
    if (state.user) {
      localStorage.setItem('manuos-user', JSON.stringify(state.user))
    } else {
      localStorage.removeItem('manuos-user')
    }
  }
})
