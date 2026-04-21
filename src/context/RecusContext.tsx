import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react'
import { AppOnboardingFlow, AppOnboardingScreenConfig } from '../api/appOnboarding'
import { AppUserOnboardingRecord } from '../api/appUserOnboardingData'

// ─── Types ───────────────────────────────────────────────────────────────────

export type RecusUser = {
  userId: string
  email?: string
  name?: string
  [key: string]: unknown
}

export type OnboardingInputValue = string | boolean

export type RecusScreenAnalytics = {
  timeSpentMs: number
}

export type RecusAnalytics = Record<string, RecusScreenAnalytics>

const toOnboardingValues = (
  onboardingRecord: AppUserOnboardingRecord | undefined,
): Record<string, OnboardingInputValue> => {
  if (!onboardingRecord) return {}

  return Object.fromEntries(
    Object.entries(onboardingRecord.onboardingData).filter((entry): entry is [
      string,
      OnboardingInputValue,
    ] => {
      const [, value] = entry
      return typeof value === 'string' || typeof value === 'boolean'
    }),
  )
}

type RecusContextValue = {
  sdkKey: string
  user: RecusUser | undefined
  onboardingFlow: AppOnboardingFlow | undefined
  appUserOnboardingData: AppUserOnboardingRecord | undefined
  screens: AppOnboardingScreenConfig[]
  initialRoute: string | undefined
  onboardingValues: Record<string, OnboardingInputValue>
  setOnboardingValue: (inputId: string, value: OnboardingInputValue) => void
  submittedValues: Record<string, OnboardingInputValue>
  submitScreen: (screenId: string) => void
  analytics: RecusAnalytics
  setCurrentScreenId: (screenId: string) => void
  isOnboardingReady: boolean
  isActive: boolean
  isNavigationEnabled: boolean
  isComplete: boolean
  markComplete: () => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const RecusContext = createContext<RecusContextValue | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

type PersistOnboardingCompleteParams = {
  submittedValues: Record<string, OnboardingInputValue>
  analytics: RecusAnalytics
}

type RecusContextProviderProps = {
  sdkKey: string
  user: RecusUser | undefined
  onboardingFlow: AppOnboardingFlow | undefined
  appUserOnboardingData: AppUserOnboardingRecord | undefined
  isNavigationEnabled: boolean
  setCurrentScreenId: (screenId: string) => void
  persistOnboardingComplete: (params: PersistOnboardingCompleteParams) => void
  children: React.ReactNode
}

const readPersistedCompletedAt = (
  record: AppUserOnboardingRecord | undefined,
): string | undefined => {
  const value = record?.metadata?.completedAt
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function RecusContextProvider({
  sdkKey,
  user,
  onboardingFlow,
  appUserOnboardingData,
  isNavigationEnabled,
  setCurrentScreenId: persistCurrentScreenId,
  persistOnboardingComplete,
  children,
}: RecusContextProviderProps) {
  const [locallyCompleted, setLocallyCompleted] = useState(false)
  const [onboardingValues, setOnboardingValues] = useState<Record<string, OnboardingInputValue>>({})
  const [submittedValues, setSubmittedValues] = useState<Record<string, OnboardingInputValue>>({})
  const [analytics, setAnalytics] = useState<RecusAnalytics>({})
  const [initialRoute, setInitialRoute] = useState<string | undefined>(undefined)
  const onboardingSeedKeyRef = useRef<string | null>(null)
  const resolvedInitialRouteSeedKeyRef = useRef<string | null>(null)

  // Refs used by the analytics tracker. Kept out of state so re-renders don't
  // reset the timer and reads/writes are O(1).
  const onboardingValuesRef = useRef(onboardingValues)
  const submittedValuesRef = useRef(submittedValues)
  const analyticsRef = useRef(analytics)
  const screensRef = useRef<AppOnboardingScreenConfig[]>([])
  const currentScreenIdRef = useRef<string | undefined>(undefined)
  const screenStartedAtRef = useRef<number | undefined>(undefined)

  const persistedCompletedAt = readPersistedCompletedAt(appUserOnboardingData)
  const isActive = !!user?.userId
  const screens = onboardingFlow?.data.screens ?? []
  const isOnboardingReady = screens.length > 0 && typeof initialRoute === 'string'
  const onboardingSeedKey = `${user?.userId ?? ''}:${onboardingFlow?.id ?? ''}`
  const isComplete = locallyCompleted || !!persistedCompletedAt

  useEffect(() => {
    onboardingValuesRef.current = onboardingValues
  }, [onboardingValues])

  useEffect(() => {
    submittedValuesRef.current = submittedValues
  }, [submittedValues])

  useEffect(() => {
    analyticsRef.current = analytics
  }, [analytics])

  useEffect(() => {
    screensRef.current = screens
  }, [screens])

  const resumeScreenId = useMemo<string | undefined>(() => {
    const value = appUserOnboardingData?.onboardingData?.currentScreenId
    return typeof value === 'string' ? value : undefined
  }, [appUserOnboardingData])

  useEffect(() => {
    const nextOnboardingValues = toOnboardingValues(appUserOnboardingData)

    if (onboardingSeedKeyRef.current !== onboardingSeedKey) {
      onboardingSeedKeyRef.current = onboardingSeedKey
      setLocallyCompleted(false)
      setOnboardingValues(nextOnboardingValues)
      onboardingValuesRef.current = nextOnboardingValues
      // Anything the server already has, the user has already submitted in a
      // previous session — seed `submittedValues` accordingly so resumes show
      // a consistent picture. Reset analytics for the new session.
      setSubmittedValues(nextOnboardingValues)
      submittedValuesRef.current = nextOnboardingValues
      setAnalytics({})
      analyticsRef.current = {}
      currentScreenIdRef.current = undefined
      screenStartedAtRef.current = undefined
      return
    }

    if (Object.keys(nextOnboardingValues).length === 0) return

    setOnboardingValues(currentValues => {
      return Object.keys(currentValues).length === 0 ? nextOnboardingValues : currentValues
    })
    setSubmittedValues(currentValues => {
      return Object.keys(currentValues).length === 0 ? nextOnboardingValues : currentValues
    })
  }, [appUserOnboardingData, onboardingSeedKey])

  useEffect(() => {
    if (!isActive || screens.length === 0) {
      if (resolvedInitialRouteSeedKeyRef.current !== null) {
        resolvedInitialRouteSeedKeyRef.current = null
        setInitialRoute(undefined)
      }
      return
    }

    if (resolvedInitialRouteSeedKeyRef.current === onboardingSeedKey) return
    if (!appUserOnboardingData) return

    const hasResumeScreen = !!resumeScreenId && screens.some(screen => screen.id === resumeScreenId)
    const nextInitialRoute = hasResumeScreen ? resumeScreenId : screens[0]?.id
    if (typeof nextInitialRoute !== 'string') return

    resolvedInitialRouteSeedKeyRef.current = onboardingSeedKey
    setInitialRoute(nextInitialRoute)
  }, [
    appUserOnboardingData,
    isActive,
    onboardingSeedKey,
    resumeScreenId,
    screens,
  ])

  // Adds elapsed time on the currently-tracked screen into `analytics` and
  // optionally re-arms the timer for the next screen. Returning early when
  // the screen hasn't actually changed keeps re-renders to a minimum.
  // Returns the analytics object that reflects the flush so callers that need
  // to persist immediately don't have to wait for React to commit the state
  // update.
  const flushScreenAnalytics = useCallback((nextScreenId?: string): RecusAnalytics => {
    const previousScreenId = currentScreenIdRef.current
    const startedAt = screenStartedAtRef.current
    const now = Date.now()
    let nextAnalytics = analyticsRef.current

    if (previousScreenId && previousScreenId !== nextScreenId && typeof startedAt === 'number') {
      const elapsed = Math.max(0, now - startedAt)
      if (elapsed > 0) {
        const previousTime = nextAnalytics[previousScreenId]?.timeSpentMs ?? 0
        nextAnalytics = {
          ...nextAnalytics,
          [previousScreenId]: { timeSpentMs: previousTime + elapsed },
        }
        analyticsRef.current = nextAnalytics
        setAnalytics(nextAnalytics)
      }
    }

    if (nextScreenId !== previousScreenId) {
      currentScreenIdRef.current = nextScreenId
      screenStartedAtRef.current = nextScreenId ? now : undefined
    }

    return nextAnalytics
  }, [])

  const setCurrentScreenId = useCallback(
    (screenId: string) => {
      flushScreenAnalytics(screenId)
      persistCurrentScreenId(screenId)
    },
    [flushScreenAnalytics, persistCurrentScreenId],
  )

  const submitScreen = useCallback((screenId: string) => {
    const screen = screensRef.current.find(candidate => candidate.id === screenId)
    const inputs = screen?.inputs
    if (!inputs || inputs.length === 0) return

    const liveValues = onboardingValuesRef.current
    const prev = submittedValuesRef.current
    let next: Record<string, OnboardingInputValue> | undefined

    for (const input of inputs) {
      const value = liveValues[input.id]
      if (value === undefined) continue
      if (prev[input.id] === value) continue
      if (!next) next = { ...prev }
      next[input.id] = value
    }

    if (next) {
      submittedValuesRef.current = next
      setSubmittedValues(next)
    }
  }, [])

  const markComplete = useCallback(() => {
    if (locallyCompleted || persistedCompletedAt) return
    const finalAnalytics = flushScreenAnalytics(undefined)
    setLocallyCompleted(true)
    persistOnboardingComplete({
      submittedValues: submittedValuesRef.current,
      analytics: finalAnalytics,
    })
  }, [
    flushScreenAnalytics,
    locallyCompleted,
    persistedCompletedAt,
    persistOnboardingComplete,
  ])

  const setOnboardingValue = useCallback((inputId: string, value: OnboardingInputValue) => {
    setOnboardingValues(prev => ({
      ...prev,
      [inputId]: value,
    }))
  }, [])

  const value = useMemo<RecusContextValue>(
    () => ({
      sdkKey,
      user,
      onboardingFlow,
      appUserOnboardingData,
      screens,
      initialRoute,
      onboardingValues,
      setOnboardingValue,
      submittedValues,
      submitScreen,
      analytics,
      setCurrentScreenId,
      isOnboardingReady,
      isActive,
      isNavigationEnabled,
      isComplete,
      markComplete,
    }),
    [
      sdkKey,
      user,
      onboardingFlow,
      appUserOnboardingData,
      screens,
      initialRoute,
      onboardingValues,
      setOnboardingValue,
      submittedValues,
      submitScreen,
      analytics,
      setCurrentScreenId,
      isOnboardingReady,
      isActive,
      isNavigationEnabled,
      isComplete,
      markComplete,
    ],
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
      '[Recus] useRecus must be used inside RecusAppProvider.',
    )
  }
  return ctx
}
