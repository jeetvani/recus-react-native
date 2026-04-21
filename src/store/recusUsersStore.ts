import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { AppUser } from '../api/appUsers'

type RecusUsersStoreState = {
  usersById: Record<string, AppUser>
  hasHydrated: boolean
  upsertUser: (userId: string, appUser: AppUser) => void
  removeUser: (userId: string) => void
  setHasHydrated: (hasHydrated: boolean) => void
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message
  return 'Unknown rehydration error.'
}

const inMemoryUsersStorage = (() => {
  const memoryStore = new Map<string, string>()

  return {
    getItem: (name: string) => memoryStore.get(name) ?? null,
    setItem: (name: string, value: string) => {
      memoryStore.set(name, value)
    },
    removeItem: (name: string) => {
      memoryStore.delete(name)
    },
  } satisfies StateStorage
})()

let hasLoggedNativeStorageFallback = false

const logNativeStorageFallback = (operation: string, error: unknown) => {
  if (hasLoggedNativeStorageFallback) return
  hasLoggedNativeStorageFallback = true
  console.warn('Recus users store is using in-memory storage fallback', {
    operation,
    error: toErrorMessage(error),
  })
}

const safeUsersStorage: StateStorage = {
  getItem: async name => {
    try {
      return await AsyncStorage.getItem(name)
    } catch (error) {
      logNativeStorageFallback('getItem', error)
      return inMemoryUsersStorage.getItem(name)
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value)
      return
    } catch (error) {
      logNativeStorageFallback('setItem', error)
      inMemoryUsersStorage.setItem(name, value)
    }
  },
  removeItem: async name => {
    try {
      await AsyncStorage.removeItem(name)
      return
    } catch (error) {
      logNativeStorageFallback('removeItem', error)
      inMemoryUsersStorage.removeItem(name)
    }
  },
}

export const useRecusUsersStore = create<RecusUsersStoreState>()(
  persist(
    (set, get) => ({
      usersById: {},
      hasHydrated: false,
      upsertUser: (userId, appUser) => {
        set(state => ({
          usersById: {
            ...state.usersById,
            [userId]: appUser,
          },
        }))
      },
      removeUser: userId => {
        const nextUsersById = { ...get().usersById }
        delete nextUsersById[userId]
        set({ usersById: nextUsersById })
      },
      setHasHydrated: hasHydrated => {
        set({ hasHydrated })
      },
    }),
    {
      name: 'recus-users-store-v1',
      storage: createJSONStorage(() => safeUsersStorage),
      partialize: state => ({
        usersById: state.usersById,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Recus users store rehydration failed', {
            error: toErrorMessage(error),
          })
        }

        if (state) {
          state.setHasHydrated(true)
          return
        }

        // Fail-open so login/onboarding is never blocked by hydration issues.
        useRecusUsersStore.setState({ hasHydrated: true })
      },
    },
  ),
)
