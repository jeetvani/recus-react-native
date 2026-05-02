import { createContext, useContext } from 'react'

export type RecusNavContextValue = {
  navigate: (screenId: string) => void
  goBack: () => void
  currentRoute: string
  canGoBack: boolean
}

export const RecusNavContext = createContext<RecusNavContextValue | null>(null)

export function useRecusNavigation(): RecusNavContextValue {
  const ctx = useContext(RecusNavContext)
  if (!ctx) {
    throw new Error(
      '[Recus] useRecusNavigation must be used inside RecusNavigator.',
    )
  }
  return ctx
}
