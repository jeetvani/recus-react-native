import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import {
  View,
  Animated,
  StyleSheet,
  useWindowDimensions,
  Easing,
} from 'react-native'
import RecusScreen, { RecusScreenConfig } from '../screens/RecusScreen'

// ─── Navigation Context ───────────────────────────────────────────────────────

type RecusNavContextValue = {
  navigate: (screenId: string) => void
  goBack: () => void
  currentRoute: string
}

const RecusNavContext = createContext<RecusNavContextValue | null>(null)

export function useRecusNavigation(): RecusNavContextValue {
  const ctx = useContext(RecusNavContext)
  if (!ctx) {
    throw new Error(
      '[Recus] useRecusNavigation must be used inside RecusNavigator.',
    )
  }
  return ctx
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TransitionState =
  | { type: 'idle' }
  | { type: 'push'; from: string; to: string }
  | { type: 'pop'; from: string; to: string }

type RecusNavigatorProps = {
  screens: RecusScreenConfig[]
  initialRoute: string
  onRouteChange?: (screenId: string) => void
}

// ─── Navigator ────────────────────────────────────────────────────────────────

export default function RecusNavigator({
  screens,
  initialRoute,
  onRouteChange,
}: RecusNavigatorProps) {
  const { width } = useWindowDimensions()
  const [stack, setStack] = useState<string[]>([initialRoute])
  const [transition, setTransition] = useState<TransitionState>({
    type: 'idle',
  })

  const progress = useRef(new Animated.Value(0)).current
  const animating = useRef(false)

  const screenMap = useMemo(() => {
    const map: Record<string, RecusScreenConfig> = {}
    for (const s of screens) {
      map[s.id] = s
    }
    return map
  }, [screens])

  const currentRoute = stack[stack.length - 1]

  useEffect(() => {
    onRouteChange?.(currentRoute)
  }, [currentRoute, onRouteChange])

  useEffect(() => {
    setStack([initialRoute])
    setTransition({ type: 'idle' })
    progress.setValue(0)
    animating.current = false
  }, [initialRoute, progress])

  // ─── Pre-mount-then-animate ─────────────────────────────────────────
  //
  // The naive sequence (commit + animate in the same tick) makes React
  // commit the new screen, mount its `RecusUiEngine`, decode its image
  // background, AND start an Animated.timing in the same frame. The JS
  // thread is busy with the mount work while the slide animation is
  // already running, which causes the visible jitter when navigating to
  // a custom-UI screen for the first time.
  //
  // Instead, `navigate` / `goBack` only set the *transition state* (which
  // triggers React to render the next screen offscreen at progress = 0).
  // A single `useEffect` watches that state and starts the actual slide
  // animation on the *next* RAF, after React's commit phase has flushed
  // and the native side has had one paint to mount/decode the new view.
  const navigate = useCallback(
    (screenId: string) => {
      if (animating.current || !screenMap[screenId]) return
      animating.current = true

      const from = stack[stack.length - 1]
      progress.setValue(0)
      setStack(prev => [...prev, screenId])
      setTransition({ type: 'push', from, to: screenId })
    },
    [stack, screenMap, progress],
  )

  const goBack = useCallback(() => {
    if (animating.current || stack.length <= 1) return
    animating.current = true

    const from = stack[stack.length - 1]
    const to = stack[stack.length - 2]
    progress.setValue(0)
    setTransition({ type: 'pop', from, to })
  }, [stack, progress])

  useEffect(() => {
    if (transition.type === 'idle') return

    const isPush = transition.type === 'push'
    let cancelled = false

    // Wait one frame so React's commit and the native side's first paint
    // (mount + image decode of the new screen at translateX = ±width) have
    // completed before the slide kicks off. This keeps the animation a
    // pure native-driver transform on already-rendered views.
    const rafId = requestAnimationFrame(() => {
      if (cancelled) return

      Animated.timing(progress, {
        toValue: 1,
        duration: isPush ? 350 : 300,
        easing: isPush ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (cancelled || !finished) return
        if (!isPush) {
          setStack(prev => prev.slice(0, -1))
        }
        setTransition({ type: 'idle' })
        animating.current = false
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [progress, transition])

  const ctx = useMemo(
    () => ({ navigate, goBack, currentRoute }),
    [navigate, goBack, currentRoute],
  )

  // ─── Render helpers ─────────────────────────────────────────────────

  const renderScreen = (screenId: string) => {
    const config = screenMap[screenId]
    if (!config) return null
    return <RecusScreen config={config} />
  }

  // ─── Idle: single screen ───────────────────────────────────────────

  if (transition.type === 'idle') {
    return (
      <RecusNavContext.Provider value={ctx}>
        <View style={StyleSheet.absoluteFill}>
          {renderScreen(currentRoute)}
        </View>
      </RecusNavContext.Provider>
    )
  }

  // ─── Transition: two layers with slide animation ───────────────────

  const isPush = transition.type === 'push'

  const fgTranslateX = isPush
    ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: [width, 0],
      })
    : progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, width],
      })

  const bgTranslateX = isPush
    ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -width * 0.3],
      })
    : progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-width * 0.3, 0],
      })

  const overlayOpacity = isPush
    ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.25],
      })
    : progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.25, 0],
      })

  const bgId = isPush ? transition.from : transition.to
  const fgId = isPush ? transition.to : transition.from

  return (
    <RecusNavContext.Provider value={ctx}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX: bgTranslateX }] },
          ]}
        >
          {renderScreen(bgId)}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: '#000', opacity: overlayOpacity },
            ]}
            pointerEvents="none"
          />
        </Animated.View>

        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [{ translateX: fgTranslateX }],
              shadowColor: '#000',
              shadowOffset: { width: -4, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          {renderScreen(fgId)}
        </Animated.View>
      </View>
    </RecusNavContext.Provider>
  )
}
