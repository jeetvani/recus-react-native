import React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import {
  RecusUiBackground,
  isGradientBackground,
  isImageBackground,
  isSolidBackground,
} from '../types'
import { GradientBackground } from './GradientBackground'
import { SolidBackground } from './SolidBackground'
import { ImageBackground } from './ImageBackground'

type BackgroundRendererProps = {
  background: RecusUiBackground
  style?: ViewStyle
  children?: React.ReactNode
}

/**
 * Switches between the three supported background variants:
 *  - `gradient` -> linear gradient via expo-linear-gradient
 *  - `solid`    -> flat color view
 *  - `image`    -> remote image with fit/position
 *
 * Add new variants here when the schema grows.
 */
export function BackgroundRenderer({
  background,
  style,
  children,
}: BackgroundRendererProps) {
  if (isGradientBackground(background)) {
    return (
      <GradientBackground background={background} style={style}>
        {children}
      </GradientBackground>
    )
  }

  if (isSolidBackground(background)) {
    return (
      <SolidBackground background={background} style={style}>
        {children}
      </SolidBackground>
    )
  }

  if (isImageBackground(background)) {
    return (
      <ImageBackground background={background} style={style}>
        {children}
      </ImageBackground>
    )
  }

  return (
    <View style={[styles.fallback, style]}>
      <Text style={styles.fallbackText}>
        Unsupported background type
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 13,
    color: '#6B7280',
  },
})
