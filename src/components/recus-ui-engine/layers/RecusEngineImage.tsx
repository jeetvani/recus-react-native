import React, { memo, useMemo } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import {
  RecusUiImageFit,
  RecusUiImageLayer,
  RecusUiImagePosition,
  RecusUiLayerDimension,
} from '../types'

type RecusEngineImageProps = {
  layer: RecusUiImageLayer
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

const toStyleDimension = (
  dimension: RecusUiLayerDimension,
): ViewStyle['width'] | ViewStyle['height'] | undefined => {
  if (dimension === 'fill') return '100%'
  if (dimension === 'hug') return undefined
  return dimension
}

const fitToContentFit = (fit: RecusUiImageFit): ExpoContentFit => {
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
  position: RecusUiImagePosition,
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

function RecusEngineImageImpl({ layer }: RecusEngineImageProps) {
  const { layout, source: imageSource, style } = layer

  const containerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    const borderRadius = style.shape === 'circle' ? 9999 : style.borderRadius

    return [
      layout.position === 'freeform' ? styles.freeform : null,
      {
        left: layout.position === 'freeform' ? layout.x : undefined,
        top: layout.position === 'freeform' ? layout.y : undefined,
        width: toStyleDimension(layout.width),
        height: toStyleDimension(layout.height),
        zIndex: layout.zIndex,
        opacity: style.opacity,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        borderRadius,
        aspectRatio: style.aspectRatio === 'free' ? undefined : style.aspectRatio,
      },
      styles.clip,
    ]
  }, [layout, style])

  const source = useMemo(() => ({ uri: imageSource.url }), [imageSource.url])
  const contentFit = useMemo(() => fitToContentFit(style.objectFit), [style.objectFit])
  const contentPosition = useMemo(
    () => positionToContentPosition(style.objectPosition),
    [style.objectPosition],
  )

  return (
    <View pointerEvents="none" style={containerStyle}>
      <ExpoImage
        accessibilityLabel={layer.alt}
        source={source}
        contentFit={contentFit}
        contentPosition={contentPosition}
        cachePolicy="memory-disk"
        priority="high"
        transition={0}
        recyclingKey={imageSource.url}
        style={styles.image}
      />
    </View>
  )
}

export const RecusEngineImage = memo(RecusEngineImageImpl)

const styles = StyleSheet.create({
  freeform: {
    position: 'absolute',
  },
  clip: {
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
})
