import React, { memo, useMemo } from 'react'
import {
  GestureResponderEvent,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  RecusUiButtonBackground,
  RecusUiButtonLayer,
  RecusUiGradientStop,
  RecusUiLayerDimension,
} from '../types'
import {
  RECUS_ENGINE_ACTION_IDS,
  useRecusEngineActions,
} from '../actions'
import { useRecusLayerAnimation } from '../animation'
import { evaluateRecusExpression } from '../../../utils/recusExpressions'

type RecusEngineButtonProps = {
  layer: RecusUiButtonLayer
}

const angleToCoords = (angleDegrees: number) => {
  const radians = (angleDegrees * Math.PI) / 180
  const dx = Math.sin(radians)
  const dy = -Math.cos(radians)

  return {
    start: { x: 0.5 - dx / 2, y: 0.5 - dy / 2 },
    end: { x: 0.5 + dx / 2, y: 0.5 + dy / 2 },
  }
}

const sortStops = (stops: RecusUiGradientStop[]): RecusUiGradientStop[] => {
  return [...stops].sort((a, b) => a.position - b.position)
}

const toStyleDimension = (
  dimension: RecusUiLayerDimension,
): ViewStyle['width'] | ViewStyle['height'] | undefined => {
  if (dimension === 'fill') return '100%'
  if (dimension === 'hug') return undefined
  return dimension
}

const isLinearGradientBackground = (
  background: RecusUiButtonBackground,
): background is Extract<RecusUiButtonBackground, { type: 'linear-gradient' }> => {
  return background.type === 'linear-gradient'
}

function RecusEngineButtonImpl({ layer }: RecusEngineButtonProps) {
  const { layout, style } = layer
  const { onContinue, onSkip, onBack, values, runActions } = useRecusEngineActions()
  const disabled = typeof layer.disabled === 'string'
    ? evaluateRecusExpression(layer.disabled, values)
    : layer.disabled === true
  const animationStyle = useRecusLayerAnimation(layer.animation)

  const containerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    const shadowStyle = style.shadow
      ? {
        shadowColor: style.shadow.color,
        shadowOffset: {
          width: style.shadow.x,
          height: style.shadow.y,
        },
        shadowOpacity: 1,
        shadowRadius: style.shadow.blur,
        elevation: Math.max(style.shadow.blur, Math.abs(style.shadow.y)),
      }
      : null

    return [
      layout.position === 'freeform' ? styles.freeform : null,
      {
        left: layout.position === 'freeform' ? layout.x : undefined,
        top: layout.position === 'freeform' ? layout.y : undefined,
        width: toStyleDimension(layout.width),
        height: toStyleDimension(layout.height),
        zIndex: layout.zIndex,
        borderRadius: style.borderRadius,
      },
      shadowStyle,
    ]
  }, [layout, style])

  const pressableStyle = useMemo<StyleProp<ViewStyle>>(() => {
    return [
      styles.button,
      {
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        borderWidth: style.borderWidth,
        opacity: disabled ? 0.5 : 1,
      },
      isLinearGradientBackground(style.background)
        ? null
        : { backgroundColor: style.background.color },
    ]
  }, [disabled, style])

  const textStyle = useMemo<StyleProp<TextStyle>>(() => {
    return {
      color: style.textColor,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
    }
  }, [style])

  const handlePress = (_event: GestureResponderEvent) => {
    if (layer.events?.onTap) {
      runActions(layer.events.onTap)
      const hasExplicitNavigation = layer.events.onTap.some(action => {
        return action.action === 'navigate' || action.action === 'complete'
      })
      if (hasExplicitNavigation) return
    }

    // Prefer the semantic button type from the schema, while retaining
    // reserved ids as a fallback for older payloads.
    const actionType = layer.buttonType ?? layer.id

    if (actionType === RECUS_ENGINE_ACTION_IDS.continue) {
      onContinue()
      return
    }

    if (actionType === RECUS_ENGINE_ACTION_IDS.skip) {
      onSkip()
      return
    }

    if (actionType === RECUS_ENGINE_ACTION_IDS.back) {
      onBack()
      return
    }

  }

  const content = (
    <Text numberOfLines={1} style={[styles.label, textStyle]}>
      {layer.label}
    </Text>
  )

  return (
    <Animated.View style={[containerStyle, animationStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={handlePress}
        style={pressableStyle}
      >
        {isLinearGradientBackground(style.background) ? (
          <ButtonGradient background={style.background}>
            {content}
          </ButtonGradient>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  )
}

/**
 * Memoised so a button only re-renders when its layer reference changes.
 * `RecusUiEngine` memoises the parsed schema, so layer references are
 * stable across host re-renders (e.g. text input keystrokes), and this
 * memo lets us skip the entire layer subtree in that case.
 */
export const RecusEngineButton = memo(RecusEngineButtonImpl)

function ButtonGradient({
  background,
  children,
}: {
  background: Extract<RecusUiButtonBackground, { type: 'linear-gradient' }>
  children: React.ReactNode
}) {
  const { colors, locations, start, end } = useMemo(() => {
    const sortedStops = sortStops(background.stops)
    const coords = angleToCoords(background.angle)

    return {
      colors: sortedStops.map(stop => stop.color),
      locations: sortedStops.map(stop => stop.position),
      start: coords.start,
      end: coords.end,
    }
  }, [background])

  return (
    <LinearGradient
      colors={colors as [string, string, ...string[]]}
      locations={locations as [number, number, ...number[]]}
      start={start}
      end={end}
      style={styles.gradient}
    >
      {children}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  freeform: {
    position: 'absolute',
  },
  button: {
    flex: 1,
    minHeight: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    paddingHorizontal: 12,
    textAlign: 'center',
  },
})
