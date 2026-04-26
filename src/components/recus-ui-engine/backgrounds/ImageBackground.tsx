import React from 'react'
import {
  ImageBackground as RNImageBackground,
  ImageResizeMode,
  ImageStyle,
  StyleSheet,
  ViewStyle,
} from 'react-native'
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

const fitToResizeMode = (fit: RecusUiImageFit | undefined): ImageResizeMode => {
  switch (fit) {
    case 'contain':
      return 'contain'
    case 'fill':
      return 'stretch'
    case 'none':
    case 'scale-down':
      return 'center'
    case 'cover':
    default:
      return 'cover'
  }
}

/**
 * Best-effort mapping of CSS background-position keywords onto the
 * native image. React Native's Image does not directly support
 * `object-position`, so for non-default positions we shift the image
 * inside its container while keeping `cover` resize behavior.
 */
const positionToImageStyle = (
  position: RecusUiImagePosition | undefined,
): ImageStyle => {
  switch (position) {
    case 'top':
      return { resizeMode: 'cover', alignSelf: 'flex-start' }
    case 'bottom':
      return { resizeMode: 'cover', alignSelf: 'flex-end' }
    case 'left':
      return { resizeMode: 'cover' }
    case 'right':
      return { resizeMode: 'cover' }
    case 'center':
    default:
      return {}
  }
}

export function ImageBackground({
  background,
  style,
  children,
}: ImageBackgroundProps) {
  const { image } = background
  const resizeMode = fitToResizeMode(image.fit)
  const positionStyle = positionToImageStyle(image.position)

  return (
    <RNImageBackground
      source={{ uri: image.url }}
      resizeMode={resizeMode}
      style={[styles.fill, style]}
      imageStyle={positionStyle}
    >
      {children}
    </RNImageBackground>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
})
