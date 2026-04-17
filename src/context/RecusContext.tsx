import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
  } from 'react'
  
  // ─── Types ───────────────────────────────────────────────────────────────────
  
  export type RecusUser = {
    userId: string
    email?: string
    name?: string
    [key: string]: unknown   // allow any extra properties
  }
  
  type RecusContextValue = {
    sdkKey: string
    user: RecusUser | undefined
    isActive: boolean        // true when userId exists
    isComplete: boolean      // true when onboarding done (hardcoded false for now)
    markComplete: () => void
  }
  
  // ─── Context ─────────────────────────────────────────────────────────────────
  
  const RecusContext = createContext<RecusContextValue | undefined>(undefined)
  
  // ─── Provider ─────────────────────────────────────────────────────────────────
  
  type RecusContextProviderProps = {
    sdkKey: string
    user: RecusUser | undefined
    children: React.ReactNode
  }
  
  export function RecusContextProvider({
    sdkKey,
    user,
    children,
  }: RecusContextProviderProps) {
    const [isComplete, setIsComplete] = useState(false)
  
    // Wake up whenever userId appears
    const isActive = !!user?.userId
  
    const markComplete = () => setIsComplete(true)
  
    const value = useMemo<RecusContextValue>(
      () => ({ sdkKey, user, isActive, isComplete, markComplete }),
      [sdkKey, user, isActive, isComplete]
    )
  
    return (
      <RecusContext.Provider value={value}>
        {children}
      </RecusContext.Provider>
    )
  }
  
  // ─── Hook ────────────────────────────────────────────────────────────────────
  
  export function useRecus(): RecusContextValue {
    const ctx = useContext(RecusContext)
    if (!ctx) {
      throw new Error(
        '[Recus] useRecus must be used inside RecusAppProvider.'
      )
    }
    return ctx
  }