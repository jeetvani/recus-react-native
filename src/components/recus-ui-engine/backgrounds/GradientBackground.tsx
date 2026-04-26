import React, { useMemo } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { RecusUiGradientBackground, RecusUiGradientStop } from '../types'

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

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
})
