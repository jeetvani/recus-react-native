import React, { useMemo } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { ImageBackground as ExpoImageBackground } from 'expo-image'
import {
  RecusUiImageBackground,
  RecusUiImageFit,
  RecusUiImagePosition,
} from '../types'

type ImageBackgroundProps = {
  background: RecusUiImageBackground
  style?: ViewStyle
  children?: React.ReactNode
}

type ExpoContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
type ExpoContentPosition =
  | 'center'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top right'
  | 'top left'
  | 'bottom right'
  | 'bottom left'

const fitToContentFit = (fit: RecusUiImageFit | undefined): ExpoContentFit => {
  switch (fit) {
    case 'contain':
    case 'fill':
    case 'none':
    case 'scale-down':
      return fit
    case 'cover':
    default:
      return 'cover'
  }
}

const positionToContentPosition = (
  position: RecusUiImagePosition | undefined,
): ExpoContentPosition => {
  switch (position) {
    case 'top':
      return 'top'
    case 'bottom':
      return 'bottom'
    case 'left':
      return 'left'
    case 'right':
      return 'right'
    case 'top-left':
      return 'top left'
    case 'top-right':
      return 'top right'
    case 'bottom-left':
      return 'bottom left'
    case 'bottom-right':
      return 'bottom right'
    case 'center':
    default:
      return 'center'
  }
}

export function ImageBackground({
  background,
  style,
  children,
}: ImageBackgroundProps) {
  const { image } = background

  // Stable source object so `expo-image` doesn't see a new reference and
  // re-trigger any internal load logic on parent re-renders.
  const source = useMemo(() => ({ uri: image.url }), [image.url])
  const contentFit = useMemo(() => fitToContentFit(image.fit), [image.fit])
  const contentPosition = useMemo(
    () => positionToContentPosition(image.position),
    [image.position],
  )

  return (
    <ExpoImageBackground
      source={source}
      contentFit={contentFit}
      contentPosition={contentPosition}
      cachePolicy="memory-disk"
      priority="high"
      transition={0}
      recyclingKey={image.url}
      style={[styles.fill, style]}
    >
      {children}
    </ExpoImageBackground>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
})
