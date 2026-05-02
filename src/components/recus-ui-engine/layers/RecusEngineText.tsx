import React, { memo, useMemo } from 'react'
import { StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native'
import {
  RecusUiLayerDimension,
  RecusUiTextDecoration,
  RecusUiTextLayer,
} from '../types'

type RecusEngineTextProps = {
  layer: RecusUiTextLayer
}

const toStyleDimension = (
  dimension: RecusUiLayerDimension,
): ViewStyle['width'] | ViewStyle['height'] | undefined => {
  if (dimension === 'fill') return '100%'
  if (dimension === 'hug') return undefined
  return dimension
}

/**
 * The web editor stores `lineHeight` as either a CSS-style multiplier
 * (e.g. `1.4`) or an absolute pixel value. RN's `<Text lineHeight>` only
 * understands pixels, so anything below this threshold is treated as a
 * ratio and resolved against the layer's font size.
 */
const LINE_HEIGHT_RATIO_CUTOFF = 4

const resolveLineHeight = (lineHeight: number, fontSize: number): number => {
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) return fontSize
  if (lineHeight < LINE_HEIGHT_RATIO_CUTOFF) {
    return Math.round(fontSize * lineHeight)
  }
  return Math.round(lineHeight)
}

const toTextDecorationLine = (
  decoration: RecusUiTextDecoration,
): TextStyle['textDecorationLine'] => {
  switch (decoration) {
    case 'underline':
      return 'underline'
    case 'line-through':
      return 'line-through'
    case 'underline line-through':
      return 'underline line-through'
    case 'none':
    default:
      return 'none'
  }
}

function RecusEngineTextImpl({ layer }: RecusEngineTextProps) {
  const { layout, style, content } = layer

  const containerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    return [
      layout.position === 'freeform' ? styles.freeform : null,
      {
        left: layout.position === 'freeform' ? layout.x : undefined,
        top: layout.position === 'freeform' ? layout.y : undefined,
        width: toStyleDimension(layout.width),
        height: toStyleDimension(layout.height),
        zIndex: layout.zIndex,
      },
    ]
  }, [layout])

  const textStyle = useMemo<StyleProp<TextStyle>>(() => {
    return {
      color: style.color,
      opacity: style.opacity,
      fontSize: style.fontSize,
      fontStyle: style.fontStyle,
      textAlign: style.textAlign,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      lineHeight: resolveLineHeight(style.lineHeight, style.fontSize),
      letterSpacing: style.letterSpacing,
      textTransform: style.textTransform,
      textDecorationLine: toTextDecorationLine(style.textDecoration),
    }
  }, [style])

  return (
    <Text
      // Text layers are visual-only; never block taps on the buttons
      // beneath them.
      pointerEvents="none"
      // Honour the canvas layout exactly. iOS/Android Dynamic Type would
      // otherwise enlarge text past its absolute container.
      allowFontScaling={false}
      // Faster line-breaking path on Android (no full Unicode segmenter).
      textBreakStrategy="simple"
      // Accessibility: announce as plain text but stay non-interactive.
      accessible
      accessibilityRole="text"
      style={[containerStyle, textStyle]}
    >
      {content}
    </Text>
  )
}

/**
 * Memoised so a text layer only re-renders when its parsed `layer`
 * reference changes. `RecusUiEngine` memoises the parsed schema so the
 * reference is stable across host re-renders (e.g. keystrokes in a
 * neighbouring `RecusEngineInput`), and this lets us skip the entire
 * text layout/styling work in that case.
 */
export const RecusEngineText = memo(RecusEngineTextImpl)

const styles = StyleSheet.create({
  freeform: {
    position: 'absolute',
  },
})
