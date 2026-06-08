import { create } from 'zustand'
import type { Route, NavParams, User } from '../types'

interface AppState {
  authed: boolean
  route: Route
  params: NavParams | null
  user: User
  login: () => void
  logout: () => void
  navigate: (route: Route, params?: NavParams | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  authed: false,
  route: 'dashboard',
  params: null,
  user: {
    name: 'Diego Parado',
    company: 'Grupo Logístico del Norte',
    email: 'diego@grupologistico.mx',
  },
  login: () => set({ authed: true, route: 'dashboard' }),
  logout: () => set({ authed: false, route: 'dashboard' }),
  navigate: (route, params = null) => {
    set({ route, params })
    window.scrollTo({ top: 0 })
  },
}))
