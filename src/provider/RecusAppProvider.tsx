import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet } from 'react-native'
import {
  RecusContextProvider,
  OnboardingInputValue,
  RecusAnalytics,
  RecusUser,
  useRecus,
} from '../context/RecusContext'
import { authenticateAppSdk } from '../api/appSdk'
import { AppOnboardingFlow, getAppOnboarding } from '../api/appOnboarding'
import {
  AppUserOnboardingRecord,
  getAppUserOnboardingData,
  patchAppUserOnboardingData,
} from '../api/appUserOnboardingData'
import { createAppUser, CreateAppUserInput } from '../api/appUsers'
import { setRecusSdkKey } from '../common'
import { prefetchFlowAssets } from '../components/recus-ui-engine'
import RecusNavigator from '../navigation/RecusNavigator'
import { useAppUserOnboardingDataStore } from '../store/appUserOnboardingDataStore'
import { useRecusUsersStore } from '../store/recusUsersStore'

const USER_META_IGNORED_KEYS = new Set(['userId', 'name', 'email', 'profilePictureUrl'])

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

const toUserMeta = (user: RecusUser): Record<string, unknown> | undefined => {
  const metaEntries = Object.entries(user).filter(([key, value]) => {
    return !USER_META_IGNORED_KEYS.has(key) && value !== undefined
  })
  if (metaEntries.length === 0) return undefined
  return Object.fromEntries(metaEntries)
}

const toCreateAppUserInput = (user: RecusUser): CreateAppUserInput => {
  const userId = user.userId.trim()
  const safeUserIdForEmail = userId.replace(/[^a-zA-Z0-9._-]/g, '-')
  const fallbackEmail = `${safeUserIdForEmail || 'recus-user'}@recus.local`
  const profilePictureUrlValue = user.profilePictureUrl

  return {
    appUserId: userId,
    name: isNonEmptyString(user.name) ? user.name.trim() : userId,
    email: isNonEmptyString(user.email) ? user.email.trim() : fallbackEmail,
    profilePictureUrl: isNonEmptyString(profilePictureUrlValue)
      ? profilePictureUrlValue.trim()
      : null,
    userMeta: toUserMeta(user),
  }
}

const toPersistedSubmittedValues = (
  onboardingRecord: AppUserOnboardingRecord | undefined,
): Record<string, OnboardingInputValue> => {
  if (!onboardingRecord) return {}

  return Object.fromEntries(
    Object.entries(onboardingRecord.onboardingData).filter((entry): entry is [
      string,
      OnboardingInputValue,
    ] => {
      const [key, value] = entry
      if (key === 'currentScreenId') return false
      return typeof value === 'string' || typeof value === 'boolean'
    }),
  )
}

const toPersistedAnalytics = (
  onboardingRecord: AppUserOnboardingRecord | undefined,
): RecusAnalytics => {
  const rawAnalytics = onboardingRecord?.metadata?.analytics
  if (
    typeof rawAnalytics !== 'object' ||
    rawAnalytics === null ||
    Array.isArray(rawAnalytics)
  ) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(rawAnalytics).flatMap(([screenId, value]) => {
      if (
        typeof value !== 'object' ||
        value === null ||
        Array.isArray(value) ||
        typeof value.timeSpentMs !== 'number' ||
        !Number.isFinite(value.timeSpentMs)
      ) {
        return []
      }

      return [[screenId, { timeSpentMs: value.timeSpentMs }]]
    }),
  )
}

const sortJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue)
  }

  if (typeof value !== 'object' || value === null) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
  )
}

const stableStringify = (value: unknown): string => {
  return JSON.stringify(sortJsonValue(value))
}

const readPersistedCompletedAt = (
  record: AppUserOnboardingRecord | undefined,
): string | undefined => {
  const value = record?.metadata?.completedAt
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

// Server PATCHes that don't include `completedAt` in their body would otherwise
// strip it from the returned record. When we already know the user has
// completed onboarding locally, fold that flag back onto the response before
// it lands in the store so a late analytics/screen PATCH can't resurrect the
// onboarding overlay.
const preserveCompletedAt = (
  responseRecord: AppUserOnboardingRecord,
  previousRecord: AppUserOnboardingRecord | undefined,
): AppUserOnboardingRecord => {
  if (readPersistedCompletedAt(responseRecord)) return responseRecord
  const previousCompletedAt = readPersistedCompletedAt(previousRecord)
  if (!previousCompletedAt) return responseRecord
  return {
    ...responseRecord,
    metadata: {
      ...responseRecord.metadata,
      completedAt: previousCompletedAt,
    },
  }
}

// ─── The overlay layer ────────────────────────────────────────────────────────

function RecusLayer() {
  const {
    isActive,
    isComplete,
    isOnboardingReady,
    isNavigationEnabled,
    screens,
    initialRoute,
    setCurrentScreenId,
  } = useRecus()
  const opacity = useRef(new Animated.Value(0)).current
  const shouldShow = isNavigationEnabled && isActive && !isComplete && isOnboardingReady

  useEffect(() => {
    if (!shouldShow) {
      opacity.setValue(0)
      return
    }

    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [opacity, shouldShow])

  if (!shouldShow || !initialRoute) return null

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity }]}>
      <RecusNavigator
        screens={screens}
        initialRoute={initialRoute}
        onRouteChange={setCurrentScreenId}
      />
    </Animated.View>
  )
}

type RecusOnboardingPersistenceBridgeProps = {
  sdkKey: string
  appUserOnboardingData: AppUserOnboardingRecord | undefined
  upsertStoredOnboardingData: (
    appUserId: string,
    onboardingData: AppUserOnboardingRecord,
  ) => void
  storedOnboardingDataRef: React.MutableRefObject<AppUserOnboardingRecord | undefined>
}

function RecusOnboardingPersistenceBridge({
  sdkKey,
  appUserOnboardingData,
  upsertStoredOnboardingData,
  storedOnboardingDataRef,
}: RecusOnboardingPersistenceBridgeProps) {
  const { isActive, isComplete, user, submittedValues, analytics } = useRecus()
  const inFlightSignatureRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isActive || !user?.userId || !appUserOnboardingData) return

    // Once the app user has finished onboarding (locally or per the persisted
    // record), the SDK must stay completely silent for them — no analytics
    // PATCH, no submission PATCH, nothing. Anything else risks resurrecting
    // the overlay on the next session.
    if (isComplete) return

    const persistedSubmittedValues = toPersistedSubmittedValues(appUserOnboardingData)
    const persistedAnalytics = toPersistedAnalytics(appUserOnboardingData)
    const desiredSignature = stableStringify({ submittedValues, analytics })
    const persistedSignature = stableStringify({
      submittedValues: persistedSubmittedValues,
      analytics: persistedAnalytics,
    })

    if (
      desiredSignature === persistedSignature ||
      inFlightSignatureRef.current === desiredSignature
    ) {
      return
    }

    inFlightSignatureRef.current = desiredSignature

    const latestRecord = storedOnboardingDataRef.current ?? appUserOnboardingData
    const latestOnboardingData = latestRecord?.onboardingData ?? {}
    const latestMetadata = latestRecord?.metadata ?? {}
    const nextOnboardingData = {
      ...latestOnboardingData,
      ...submittedValues,
    }

    patchAppUserOnboardingData({
      sdkKey,
      appUserId: user.userId,
      onboardingData: nextOnboardingData,
      metadata: {
        ...latestMetadata,
        analytics,
      },
    })
      .then(response => {
        const merged = preserveCompletedAt(
          response.userOnboardingData,
          storedOnboardingDataRef.current,
        )
        storedOnboardingDataRef.current = merged
        upsertStoredOnboardingData(user.userId, merged)
      })
      .catch(error => {
        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : 'Unable to update Recus onboarding submission.'
        console.error('Recus onboarding submission update failed', {
          userId: user.userId,
          error: errorMessage,
        })
      })
      .finally(() => {
        if (inFlightSignatureRef.current === desiredSignature) {
          inFlightSignatureRef.current = null
        }
      })
  }, [
    analytics,
    appUserOnboardingData,
    isActive,
    isComplete,
    sdkKey,
    storedOnboardingDataRef,
    submittedValues,
    upsertStoredOnboardingData,
    user,
  ])

  return null
}

// ─── Public Provider ──────────────────────────────────────────────────────────

type RecusAppProviderProps = {
  sdkKey: string
  user: RecusUser | undefined
  children: React.ReactNode
}

export function RecusAppProvider({
  sdkKey,
  user,
  children,
}: RecusAppProviderProps) {
  const [appOnboardingFlow, setAppOnboardingFlow] = useState<AppOnboardingFlow | undefined>(undefined)
  const [assignedOnboardingFlow, setAssignedOnboardingFlow] = useState<AppOnboardingFlow | undefined>(undefined)
  const [isNavigationEnabled, setIsNavigationEnabled] = useState(false)
  const syncingUserIdRef = useRef<string | null>(null)
  const syncingOnboardingDataUserIdRef = useRef<string | null>(null)
  const hasHydratedUsersStore = useRecusUsersStore(state => state.hasHydrated)
  const hasHydratedOnboardingDataStore = useAppUserOnboardingDataStore(state => state.hasHydrated)
  const upsertStoredRecusUser = useRecusUsersStore(state => state.upsertUser)
  const upsertStoredOnboardingData = useAppUserOnboardingDataStore(
    state => state.upsertOnboardingData,
  )
  const normalizedUserId = user?.userId?.trim()
  const storedRecusUser = useRecusUsersStore(state => {
    if (!normalizedUserId) return undefined
    return state.usersById[normalizedUserId]
  })
  const storedOnboardingData = useAppUserOnboardingDataStore(state => {
    if (!normalizedUserId) return undefined
    return state.onboardingDataByAppUserId[normalizedUserId]
  })
  const storedOnboardingDataRef = useRef(storedOnboardingData)
  useEffect(() => {
    storedOnboardingDataRef.current = storedOnboardingData
  }, [storedOnboardingData])
  const normalizedUser = useMemo<RecusUser | undefined>(() => {
    if (!user || !normalizedUserId) return undefined
    return {
      ...user,
      userId: normalizedUserId,
    }
  }, [normalizedUserId, user])
  const assignedOnboardingFlowId = storedOnboardingData?.onboardingFlowId
  const onboardingFlow = useMemo(() => {
    if (!normalizedUser) return appOnboardingFlow
    if (!assignedOnboardingFlowId) return appOnboardingFlow
    return assignedOnboardingFlow?.id === assignedOnboardingFlowId
      ? assignedOnboardingFlow
      : undefined
  }, [
    appOnboardingFlow,
    assignedOnboardingFlow,
    assignedOnboardingFlowId,
    normalizedUser,
  ])

  const publishAssignedOnboardingFlow = useCallback(
    async (nextOnboardingFlow: AppOnboardingFlow | undefined) => {
      if (!nextOnboardingFlow) return

      await prefetchFlowAssets(nextOnboardingFlow)
      setAssignedOnboardingFlow(nextOnboardingFlow)
      console.info('Recus SDK assigned onboarding loaded', {
        id: nextOnboardingFlow.id,
        appId: nextOnboardingFlow.appId,
        name: nextOnboardingFlow.name,
        screens: nextOnboardingFlow.data.screens.length,
      })
    },
    [],
  )

  useEffect(() => {
    setRecusSdkKey(sdkKey)

    return () => {
      setRecusSdkKey(undefined)
    }
  }, [sdkKey])

  useEffect(() => {
    let isMounted = true

    const validateSdkKey = async () => {
      let currentStep = 'validate SDK key'
      setAppOnboardingFlow(undefined)
      setAssignedOnboardingFlow(undefined)

      try {
        await authenticateAppSdk({ sdkKey })

        if (!isMounted) return
        console.info('Recus SDK Initialized')

        currentStep = 'fetch onboarding flow'
        const nextOnboardingFlow = await getAppOnboarding({ sdkKey })

        if (!isMounted) return

        currentStep = 'prefetch onboarding assets'
        // Warm every referenced image before publishing the flow to context so
        // screen rendering starts with the image cache already populated.
        await prefetchFlowAssets(nextOnboardingFlow)

        if (!isMounted) return

        setAppOnboardingFlow(nextOnboardingFlow)
        console.info('Recus SDK Onboarding Loaded', {
          id: nextOnboardingFlow.id,
          appId: nextOnboardingFlow.appId,
          name: nextOnboardingFlow.name,
          screens: nextOnboardingFlow.data.screens.length,
        })
      } catch (error) {
        if (!isMounted) return
        setAppOnboardingFlow(undefined)
        setAssignedOnboardingFlow(undefined)

        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : `Unable to ${currentStep}.`

        console.error('Recus SDK Validation', {
          step: currentStep,
          error: errorMessage,
        })
      }
    }

    validateSdkKey()

    return () => {
      isMounted = false
    }
  }, [sdkKey])

  useEffect(() => {
    let isMounted = true

    const syncRecusUser = async () => {
      if (!hasHydratedUsersStore) {
        setIsNavigationEnabled(false)
        return
      }

      if (!normalizedUser) {
        setIsNavigationEnabled(false)
        return
      }

      if (storedRecusUser) {
        setIsNavigationEnabled(true)
        return
      }

      setIsNavigationEnabled(false)
      if (syncingUserIdRef.current === normalizedUser.userId) return
      syncingUserIdRef.current = normalizedUser.userId

      try {
        const response = await createAppUser({
          sdkKey,
          input: toCreateAppUserInput(normalizedUser),
        })

        if (!isMounted) return

        await publishAssignedOnboardingFlow(response.onboardingFlow)

        if (!isMounted) return

        upsertStoredRecusUser(normalizedUser.userId, response.appUser)
        if (response.userOnboardingData) {
          upsertStoredOnboardingData(normalizedUser.userId, response.userOnboardingData)
        }
        setIsNavigationEnabled(true)
        console.info('Recus user synchronized', {
          userId: normalizedUser.userId,
          appUserRecordId: response.appUser.id,
        })
      } catch (error) {
        if (!isMounted) return

        setIsNavigationEnabled(false)
        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : 'Unable to configure Recus user.'
        console.error('Recus user synchronization failed', {
          userId: normalizedUser.userId,
          error: errorMessage,
        })
      } finally {
        if (syncingUserIdRef.current === normalizedUser.userId) {
          syncingUserIdRef.current = null
        }
      }
    }

    syncRecusUser()

    return () => {
      isMounted = false
    }
  }, [
    hasHydratedUsersStore,
    normalizedUser,
    sdkKey,
    storedRecusUser,
    publishAssignedOnboardingFlow,
    upsertStoredOnboardingData,
    upsertStoredRecusUser,
  ])

  useEffect(() => {
    let isMounted = true

    const syncOnboardingData = async () => {
      if (!hasHydratedUsersStore || !hasHydratedOnboardingDataStore) {
        return
      }

      if (!normalizedUser || !storedRecusUser) {
        return
      }

      const hasAssignedFlow =
        !storedOnboardingData?.onboardingFlowId ||
        assignedOnboardingFlow?.id === storedOnboardingData.onboardingFlowId

      if (storedOnboardingData && hasAssignedFlow) {
        return
      }

      if (syncingOnboardingDataUserIdRef.current === normalizedUser.userId) return
      syncingOnboardingDataUserIdRef.current = normalizedUser.userId

      try {
        const response = await getAppUserOnboardingData({
          sdkKey,
          appUserId: normalizedUser.userId,
        })

        if (!isMounted) return

        await publishAssignedOnboardingFlow(response.onboardingFlow)

        if (!isMounted) return

        upsertStoredOnboardingData(normalizedUser.userId, response.userOnboardingData)
        console.info('Recus app-user onboarding-data loaded', {
          userId: normalizedUser.userId,
          onboardingDataId: response.userOnboardingData.id,
          onboardingFlowId: response.userOnboardingData.onboardingFlowId,
        })
      } catch (error) {
        if (!isMounted) return

        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : 'Unable to load app-user onboarding-data.'
        console.error('Recus app-user onboarding-data fetch failed', {
          userId: normalizedUser.userId,
          error: errorMessage,
        })
      } finally {
        if (syncingOnboardingDataUserIdRef.current === normalizedUser.userId) {
          syncingOnboardingDataUserIdRef.current = null
        }
      }
    }

    syncOnboardingData()

    return () => {
      isMounted = false
    }
  }, [
    hasHydratedOnboardingDataStore,
    hasHydratedUsersStore,
    assignedOnboardingFlow,
    normalizedUser,
    publishAssignedOnboardingFlow,
    sdkKey,
    storedOnboardingData,
    storedRecusUser,
    upsertStoredOnboardingData,
  ])

  const setCurrentScreenId = useCallback(
    (screenId: string) => {
      if (!normalizedUserId) return

      const existingRecord = storedOnboardingDataRef.current
      // Onboarding has already been completed for this app user — do nothing.
      if (readPersistedCompletedAt(existingRecord)) return

      const existingOnboardingData = existingRecord?.onboardingData ?? {}

      if (existingOnboardingData.currentScreenId === screenId) return

      const nextOnboardingData = {
        ...existingOnboardingData,
        currentScreenId: screenId,
      }

      if (existingRecord) {
        const optimisticRecord = {
          ...existingRecord,
          onboardingData: nextOnboardingData,
        }
        storedOnboardingDataRef.current = optimisticRecord
        upsertStoredOnboardingData(normalizedUserId, optimisticRecord)
      }

      patchAppUserOnboardingData({
        sdkKey,
        appUserId: normalizedUserId,
        onboardingData: nextOnboardingData,
      })
        .then(response => {
          const merged = preserveCompletedAt(
            response.userOnboardingData,
            storedOnboardingDataRef.current,
          )
          storedOnboardingDataRef.current = merged
          upsertStoredOnboardingData(normalizedUserId, merged)
        })
        .catch(error => {
          const errorMessage =
            error instanceof Error && error.message
              ? error.message
              : 'Unable to update Recus current screen.'
          console.error('Recus current screen update failed', {
            userId: normalizedUserId,
            screenId,
            error: errorMessage,
          })
        })
    },
    [normalizedUserId, sdkKey, upsertStoredOnboardingData],
  )

  const persistOnboardingComplete = useCallback(
    ({
      submittedValues: finalSubmittedValues,
      analytics: finalAnalytics,
    }: {
      submittedValues: Record<string, OnboardingInputValue>
      analytics: RecusAnalytics
    }) => {
      if (!normalizedUserId) return

      const existingRecord = storedOnboardingDataRef.current
      if (readPersistedCompletedAt(existingRecord)) return

      const completedAt = new Date().toISOString()
      const nextOnboardingData = {
        ...(existingRecord?.onboardingData ?? {}),
        ...finalSubmittedValues,
      }
      const nextMetadata = {
        ...(existingRecord?.metadata ?? {}),
        analytics: finalAnalytics,
        completedAt,
      }

      if (existingRecord) {
        const optimisticRecord: AppUserOnboardingRecord = {
          ...existingRecord,
          onboardingData: nextOnboardingData,
          metadata: nextMetadata,
        }
        storedOnboardingDataRef.current = optimisticRecord
        upsertStoredOnboardingData(normalizedUserId, optimisticRecord)
      }

      patchAppUserOnboardingData({
        sdkKey,
        appUserId: normalizedUserId,
        onboardingData: nextOnboardingData,
        metadata: nextMetadata,
      })
        .then(response => {
          const merged = preserveCompletedAt(
            response.userOnboardingData,
            storedOnboardingDataRef.current,
          )
          storedOnboardingDataRef.current = merged
          upsertStoredOnboardingData(normalizedUserId, merged)
          console.info('Recus onboarding marked complete', {
            userId: normalizedUserId,
            completedAt,
          })
        })
        .catch(error => {
          const errorMessage =
            error instanceof Error && error.message
              ? error.message
              : 'Unable to mark Recus onboarding complete.'
          console.error('Recus onboarding completion update failed', {
            userId: normalizedUserId,
            error: errorMessage,
          })
        })
    },
    [normalizedUserId, sdkKey, upsertStoredOnboardingData],
  )

  return (
    <RecusContextProvider
      sdkKey={sdkKey}
      user={normalizedUser}
      onboardingFlow={onboardingFlow}
      appUserOnboardingData={storedOnboardingData}
      isNavigationEnabled={isNavigationEnabled}
      setCurrentScreenId={setCurrentScreenId}
      persistOnboardingComplete={persistOnboardingComplete}
    >
      {children}
      <RecusOnboardingPersistenceBridge
        sdkKey={sdkKey}
        appUserOnboardingData={storedOnboardingData}
        upsertStoredOnboardingData={upsertStoredOnboardingData}
        storedOnboardingDataRef={storedOnboardingDataRef}
      />
      <RecusLayer />
    </RecusContextProvider>
  )
}
