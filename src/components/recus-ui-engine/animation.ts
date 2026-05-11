import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { RecusUiLayerAnimation } from './types'

const toEasing = (easing: RecusUiLayerAnimation['easing']) => {
  switch (easing) {
    case 'linear':
      return Easing.linear
    case 'ease-in':
      return Easing.in(Easing.cubic)
    case 'ease-out':
      return Easing.out(Easing.cubic)
    case 'ease-in-out':
      return Easing.inOut(Easing.cubic)
    case 'ease':
    default:
      return Easing.inOut(Easing.ease)
  }
}

const initialAnimatedState = (animation?: RecusUiLayerAnimation) => {
  switch (animation?.preset) {
    case 'slide-up':
      return { opacity: 0, translateX: 0, translateY: 24, scale: 1 }
    case 'slide-down':
      return { opacity: 0, translateX: 0, translateY: -24, scale: 1 }
    case 'slide-left':
      return { opacity: 0, translateX: 24, translateY: 0, scale: 1 }
    case 'slide-right':
      return { opacity: 0, translateX: -24, translateY: 0, scale: 1 }
    case 'zoom-in':
      return { opacity: 0, translateX: 0, translateY: 0, scale: 0.92 }
    case 'pop':
      return { opacity: 0, translateX: 0, translateY: 0, scale: 0.82 }
    case 'bounce':
      return { opacity: 0, translateX: 0, translateY: 28, scale: 1 }
    case 'fade-in':
    case 'pulse':
      return { opacity: animation.preset === 'fade-in' ? 0 : 1, translateX: 0, translateY: 0, scale: 1 }
    default:
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1 }
  }
}

const useReduceMotion = (): boolean => {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    let mounted = true

    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) setReduceMotion(enabled)
    })

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => setReduceMotion(enabled),
    )

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  return reduceMotion
}

export const useRecusLayerAnimation = (
  animation?: RecusUiLayerAnimation,
): StyleProp<ViewStyle> => {
  const reduceMotion = useReduceMotion()
  const initialState = useMemo(() => initialAnimatedState(animation), [animation])
  const opacity = useRef(new Animated.Value(initialState.opacity)).current
  const translateX = useRef(new Animated.Value(initialState.translateX)).current
  const translateY = useRef(new Animated.Value(initialState.translateY)).current
  const scale = useRef(new Animated.Value(initialState.scale)).current

  useEffect(() => {
    if (!animation || reduceMotion) {
      opacity.setValue(1)
      translateX.setValue(0)
      translateY.setValue(0)
      scale.setValue(1)
      return undefined
    }

    const nextInitialState = initialAnimatedState(animation)
    opacity.setValue(nextInitialState.opacity)
    translateX.setValue(nextInitialState.translateX)
    translateY.setValue(nextInitialState.translateY)
    scale.setValue(nextInitialState.scale)

    const easing = toEasing(animation.easing)
    const duration = animation.durationMs
    const delay = animation.delayMs

    const timing = (
      value: Animated.Value,
      toValue: number,
      timingDuration = duration,
    ) => Animated.timing(value, {
      toValue,
      duration: timingDuration,
      delay,
      easing,
      useNativeDriver: true,
    })

    const animations: Animated.CompositeAnimation[] = []

    switch (animation.preset) {
      case 'pop':
        animations.push(
          Animated.parallel([
            timing(opacity, 1),
            Animated.sequence([
              Animated.timing(scale, {
                toValue: 1.06,
                duration: Math.round(duration * 0.7),
                delay,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 1,
                duration: Math.round(duration * 0.3),
                easing,
                useNativeDriver: true,
              }),
            ]),
          ]),
        )
        break
      case 'bounce':
        animations.push(
          Animated.parallel([
            timing(opacity, 1),
            Animated.spring(translateY, {
              toValue: 0,
              delay,
              damping: 8,
              stiffness: 120,
              mass: 0.8,
              useNativeDriver: true,
            }),
          ]),
        )
        break
      case 'pulse':
        animations.push(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(scale, {
              toValue: 1.04,
              duration: Math.round(duration / 2),
              easing,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: Math.round(duration / 2),
              easing,
              useNativeDriver: true,
            }),
          ]),
        )
        break
      default:
        animations.push(
          Animated.parallel([
            timing(opacity, 1),
            timing(translateX, 0),
            timing(translateY, 0),
            timing(scale, 1),
          ]),
        )
        break
    }

    const runner = animations[0]
    runner.start()

    return () => {
      runner.stop()
    }
  }, [animation, opacity, reduceMotion, scale, translateX, translateY])

  return {
    opacity,
    transform: [{ translateX }, { translateY }, { scale }],
  }
}
