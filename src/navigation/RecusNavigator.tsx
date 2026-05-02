import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  Animated,
  StyleSheet,
  useWindowDimensions,
  Easing,
  BackHandler,
  PanResponder,
  Platform,
} from 'react-native'
import RecusScreen, { RecusScreenConfig } from '../screens/RecusScreen'
import { RecusNavContext } from './RecusNavigationContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type TransitionState =
  | { type: 'idle' }
  | { type: 'push'; from: string; to: string }
  | { type: 'pop'; from: string; to: string; interactive?: boolean }

type StackEntry = {
  id: string
  backTarget?: string
}

type RecusNavigatorProps = {
  screens: RecusScreenConfig[]
  initialRoute: string
  onRouteChange?: (screenId: string) => void
}

const IOS_BACK_SWIPE_EDGE_WIDTH = 32

// ─── Navigator ────────────────────────────────────────────────────────────────

export default function RecusNavigator({
  screens,
  initialRoute,
  onRouteChange,
}: RecusNavigatorProps) {
  const { width } = useWindowDimensions()
  const incomingBackTargetMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const screen of screens) {
      for (const transition of screen.transitions ?? []) {
        if (transition.backAllowed === true && !map[transition.to]) {
          map[transition.to] = screen.id
        }
      }
    }
    return map
  }, [screens])
  const createStackEntry = useCallback(
    (screenId: string, backTarget = incomingBackTargetMap[screenId]): StackEntry => ({
      id: screenId,
      backTarget,
    }),
    [incomingBackTargetMap],
  )
  const [stack, setStack] = useState<StackEntry[]>(() => [createStackEntry(initialRoute)])
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

  const currentEntry = stack[stack.length - 1]
  const currentRoute = currentEntry.id
  const canGoBack = !!currentEntry.backTarget

  useEffect(() => {
    onRouteChange?.(currentRoute)
  }, [currentRoute, onRouteChange])

  useEffect(() => {
    setStack([createStackEntry(initialRoute)])
    setTransition({ type: 'idle' })
    progress.setValue(0)
    animating.current = false
  }, [createStackEntry, initialRoute, progress])

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

      const from = stack[stack.length - 1].id
      const configuredTransition = screenMap[from]?.transitions?.find(
        transition => transition.to === screenId,
      )
      progress.setValue(0)
      setStack(prev => [
        ...prev,
        createStackEntry(
          screenId,
          configuredTransition?.backAllowed === true ? from : undefined,
        ),
      ])
      setTransition({ type: 'push', from, to: screenId })
    },
    [createStackEntry, stack, screenMap, progress],
  )

  const goBack = useCallback(() => {
    const current = stack[stack.length - 1]
    if (animating.current || !current.backTarget) return
    animating.current = true

    const from = current.id
    const to = current.backTarget
    progress.setValue(0)
    setTransition({ type: 'pop', from, to })
  }, [stack, progress])

  const completePop = useCallback(
    (to: string) => {
      setStack(prev => {
        const previous = prev[prev.length - 2]
        if (previous?.id === to) {
          return prev.slice(0, -1)
        }

        return [...prev.slice(0, -1), createStackEntry(to)]
      })
      setTransition({ type: 'idle' })
      progress.setValue(0)
      animating.current = false
    },
    [createStackEntry, progress],
  )

  const cancelInteractivePop = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return
      setTransition({ type: 'idle' })
      progress.setValue(0)
      animating.current = false
    })
  }, [progress])

  const iosBackPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (event, gestureState) => {
          return (
            Platform.OS === 'ios' &&
            transition.type === 'idle' &&
            canGoBack &&
            event.nativeEvent.pageX <= IOS_BACK_SWIPE_EDGE_WIDTH &&
            gestureState.dx > 8 &&
            Math.abs(gestureState.dy) < 24
          )
        },
        onPanResponderGrant: () => {
          const current = stack[stack.length - 1]
          if (animating.current || !current.backTarget) return

          animating.current = true
          progress.setValue(0)
          setTransition({
            type: 'pop',
            from: current.id,
            to: current.backTarget,
            interactive: true,
          })
        },
        onPanResponderMove: (_event, gestureState) => {
          if (!animating.current) return
          progress.setValue(Math.max(0, Math.min(1, gestureState.dx / width)))
        },
        onPanResponderRelease: (_event, gestureState) => {
          const current = stack[stack.length - 1]
          if (!animating.current || !current.backTarget) return

          const shouldComplete =
            gestureState.dx > width * 0.33 || gestureState.vx > 0.5

          if (!shouldComplete) {
            cancelInteractivePop()
            return
          }

          Animated.timing(progress, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (!finished) return
            completePop(current.backTarget!)
          })
        },
        onPanResponderTerminate: cancelInteractivePop,
      }),
    [
      canGoBack,
      cancelInteractivePop,
      completePop,
      progress,
      stack,
      transition.type,
      width,
    ],
  )

  useEffect(() => {
    if (!canGoBack) return undefined

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack()
      return true
    })

    return () => {
      subscription.remove()
    }
  }, [canGoBack, goBack])

  useEffect(() => {
    if (transition.type === 'idle') return
    if (transition.type === 'pop' && transition.interactive) return

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
          completePop(transition.to)
          return
        }
        setTransition({ type: 'idle' })
        animating.current = false
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [completePop, progress, transition])

  const ctx = useMemo(
    () => ({ navigate, goBack, currentRoute, canGoBack }),
    [navigate, goBack, currentRoute, canGoBack],
  )

  // ─── Render helpers ─────────────────────────────────────────────────

  const renderScreen = (screenId: string) => {
    const config = screenMap[screenId]
    if (!config) return null
    return <RecusScreen config={config} />
  }

  const panHandlers =
    Platform.OS === 'ios' && canGoBack ? iosBackPanResponder.panHandlers : undefined

  // ─── Idle: single screen ───────────────────────────────────────────

  if (transition.type === 'idle') {
    return (
      <RecusNavContext.Provider value={ctx}>
        <View style={StyleSheet.absoluteFill} {...panHandlers}>
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
      <View style={StyleSheet.absoluteFill} {...panHandlers}>
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
