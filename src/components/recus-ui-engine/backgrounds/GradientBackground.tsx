import React, { useMemo } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'
import {
  RecusUiGradientBackground,
  RecusUiGradientStop,
  RecusUiLinearGradient,
  RecusUiRadialGradient,
} from '../types'

type GradientBackgroundProps = {
  background: RecusUiGradientBackground
  style?: ViewStyle
  children?: React.ReactNode
}

/**
 * Convert a CSS-style gradient angle (in degrees) into the
 * `start` / `end` coordinates expected by `expo-linear-gradient`.
 *
 * CSS convention: 0deg -> gradient flows toward the top, 90deg -> right,
 * 180deg -> bottom, 270deg -> left. expo-linear-gradient takes start/end
 * as unit-square coordinates (0,0 = top-left, 1,1 = bottom-right).
 */
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

export function GradientBackground({
  background,
  style,
  children,
}: GradientBackgroundProps) {
  const { gradient } = background

  if (gradient.type === 'radial') {
    return (
      <RadialGradientBackground gradient={gradient} style={style}>
        {children}
      </RadialGradientBackground>
    )
  }

  return (
    <LinearGradientBackground gradient={gradient} style={style}>
      {children}
    </LinearGradientBackground>
  )
}

function LinearGradientBackground({
  gradient,
  style,
  children,
}: {
  gradient: RecusUiLinearGradient
  style?: ViewStyle
  children?: React.ReactNode
}) {
  const { colors, locations, start, end } = useMemo(() => {
    const sortedStops = sortStops(gradient.stops)
    const stopColors = sortedStops.map(stop => stop.color)
    const stopLocations = sortedStops.map(stop => stop.position)
    const coords = angleToCoords(gradient.angle ?? 0)

    return {
      colors: stopColors,
      locations: stopLocations,
      start: coords.start,
      end: coords.end,
    }
  }, [gradient.stops, gradient.angle])

  return (
    <LinearGradient
      colors={colors as [string, string, ...string[]]}
      locations={locations as [number, number, ...number[]]}
      start={start}
      end={end}
      style={[styles.fill, style]}
    >
      {children}
    </LinearGradient>
  )
}

function RadialGradientBackground({
  gradient,
  style,
  children,
}: {
  gradient: RecusUiRadialGradient
  style?: ViewStyle
  children?: React.ReactNode
}) {
  const stops = useMemo(() => sortStops(gradient.stops), [gradient.stops])

  return (
    <View style={[styles.fill, style]}>
      <Svg height="100%" style={StyleSheet.absoluteFill} width="100%">
        <Defs>
          <RadialGradient
            id="recus-radial-background"
            cx="50%"
            cy="50%"
            r="75%"
            fx="50%"
            fy="50%"
          >
            {stops.map((stop, index) => (
              <Stop
                key={`${stop.color}-${stop.position}-${index}`}
                offset={`${Math.max(0, Math.min(1, stop.position)) * 100}%`}
                stopColor={stop.color}
              />
            ))}
          </RadialGradient>
        </Defs>
        <Rect
          height="100%"
          width="100%"
          fill="url(#recus-radial-background)"
        />
      </Svg>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
})
