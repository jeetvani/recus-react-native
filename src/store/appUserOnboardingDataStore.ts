import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { AppUserOnboardingRecord } from '../api/appUserOnboardingData'

type AppUserOnboardingDataStoreState = {
  onboardingDataByAppUserId: Record<string, AppUserOnboardingRecord>
  hasHydrated: boolean
  upsertOnboardingData: (appUserId: string, onboardingData: AppUserOnboardingRecord) => void
  removeOnboardingData: (appUserId: string) => void
  setHasHydrated: (hasHydrated: boolean) => void
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message
  return 'Unknown rehydration error.'
}

const inMemoryOnboardingDataStorage = (() => {
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
  console.warn('Recus app-user onboarding-data store is using in-memory storage fallback', {
    operation,
    error: toErrorMessage(error),
  })
}

const safeOnboardingDataStorage: StateStorage = {
  getItem: async name => {
    try {
      return await AsyncStorage.getItem(name)
    } catch (error) {
      logNativeStorageFallback('getItem', error)
      return inMemoryOnboardingDataStorage.getItem(name)
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value)
      return
    } catch (error) {
      logNativeStorageFallback('setItem', error)
      inMemoryOnboardingDataStorage.setItem(name, value)
    }
  },
  removeItem: async name => {
    try {
      await AsyncStorage.removeItem(name)
      return
    } catch (error) {
      logNativeStorageFallback('removeItem', error)
      inMemoryOnboardingDataStorage.removeItem(name)
    }
  },
}

export const useAppUserOnboardingDataStore = create<AppUserOnboardingDataStoreState>()(
  persist(
    (set, get) => ({
      onboardingDataByAppUserId: {},
      hasHydrated: false,
      upsertOnboardingData: (appUserId, onboardingData) => {
        set(state => ({
          onboardingDataByAppUserId: {
            ...state.onboardingDataByAppUserId,
            [appUserId]: onboardingData,
          },
        }))
      },
      removeOnboardingData: appUserId => {
        const nextOnboardingDataByAppUserId = { ...get().onboardingDataByAppUserId }
        delete nextOnboardingDataByAppUserId[appUserId]
        set({ onboardingDataByAppUserId: nextOnboardingDataByAppUserId })
      },
      setHasHydrated: hasHydrated => {
        set({ hasHydrated })
      },
    }),
    {
      name: 'recus-app-user-onboarding-data-store-v1',
      storage: createJSONStorage(() => safeOnboardingDataStorage),
      partialize: state => ({
        onboardingDataByAppUserId: state.onboardingDataByAppUserId,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Recus app-user onboarding-data store rehydration failed', {
            error: toErrorMessage(error),
          })
        }

        if (state) {
          state.setHasHydrated(true)
          return
        }

        useAppUserOnboardingDataStore.setState({ hasHydrated: true })
      },
    },
  ),
)
