/**
 * Recus UI Engine schema types.
 *
 * These mirror the JSON schema produced by the web-side editor.
 * Keep this in sync with the canonical schema definition.
 */

export type RecusUiCanvas = {
  width: number
  height: number
  device?: string
}

export type RecusUiGradientStop = {
  color: string
  position: number
}

export type RecusUiLinearGradient = {
  type: 'linear'
  angle: number
  stops: RecusUiGradientStop[]
}

export type RecusUiGradientBackground = {
  type: 'gradient'
  gradient: RecusUiLinearGradient
}

export type RecusUiSolidBackground = {
  type: 'solid'
  color: string
}

export type RecusUiButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'

export type RecusUiLayerPosition = 'freeform' | 'flow'

export type RecusUiLayerDimension = number | `${number}%` | 'fill' | 'hug'

export type RecusUiLayerLayout = {
  position: RecusUiLayerPosition
  x?: `${number}%`
  y?: `${number}%`
  width: RecusUiLayerDimension
  height: RecusUiLayerDimension
  zIndex?: number
}

export type RecusUiButtonSolidBackground = {
  type: 'solid'
  color: string
}

export type RecusUiButtonLinearGradientBackground = {
  type: 'linear-gradient'
  angle: number
  stops: RecusUiGradientStop[]
}

export type RecusUiButtonBackground =
  | RecusUiButtonSolidBackground
  | RecusUiButtonLinearGradientBackground

export type RecusUiButtonFontWeight = '400' | '500' | '600' | '700' | '800'

export type RecusUiShadow = {
  color: string
  x: number
  y: number
  blur: number
}

export type RecusUiButtonStyle = {
  background: RecusUiButtonBackground
  textColor: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  fontSize: number
  fontWeight: RecusUiButtonFontWeight
  shadow?: RecusUiShadow | null
}

export type RecusUiButtonTapAction = Record<string, unknown>

export type RecusUiButtonEvents = {
  onTap?: RecusUiButtonTapAction[]
}

export type RecusUiButtonLayer = {
  id: string
  type: 'button'
  label: string
  disabled: boolean | string
  variant: RecusUiButtonVariant
  layout: RecusUiLayerLayout
  style: RecusUiButtonStyle
  events?: RecusUiButtonEvents
}

export type RecusUiImageFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'

export type RecusUiImagePosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export type RecusUiImageBackground = {
  type: 'image'
  image: {
    url: string
    fit?: RecusUiImageFit
    position?: RecusUiImagePosition
  }
}

export type RecusUiBackground =
  | RecusUiGradientBackground
  | RecusUiSolidBackground
  | RecusUiImageBackground

export type RecusUiLayer = RecusUiButtonLayer

export type RecusUiSchema = {
  schemaVersion: string
  canvas: RecusUiCanvas
  background: RecusUiBackground
  layers: RecusUiLayer[]
}

export type RecusUi = RecusUiSchema | Record<string, unknown>

export const isGradientBackground = (
  background: RecusUiBackground,
): background is RecusUiGradientBackground => background.type === 'gradient'

export const isSolidBackground = (
  background: RecusUiBackground,
): background is RecusUiSolidBackground => background.type === 'solid'

export const isImageBackground = (
  background: RecusUiBackground,
): background is RecusUiImageBackground => background.type === 'image'

export const isButtonLayer = (
  layer: RecusUiLayer,
): layer is RecusUiButtonLayer => layer.type === 'button'
