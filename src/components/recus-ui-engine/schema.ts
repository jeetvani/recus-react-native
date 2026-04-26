import {
  RecusUi,
  RecusUiBackground,
  RecusUiButtonBackground,
  RecusUiButtonEvents,
  RecusUiButtonFontWeight,
  RecusUiButtonLayer,
  RecusUiButtonStyle,
  RecusUiButtonVariant,
  RecusUiCanvas,
  RecusUiGradientStop,
  RecusUiImageBackground,
  RecusUiImageFit,
  RecusUiImagePosition,
  RecusUiLayer,
  RecusUiLayerDimension,
  RecusUiLayerLayout,
  RecusUiLayerPosition,
  RecusUiLinearGradient,
  RecusUiSchema,
  RecusUiShadow,
  RecusUiSolidBackground,
} from './types'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const toString = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined
}

const toFiniteNumber = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const toNonNegativeNumber = (value: unknown): number | undefined => {
  const numberValue = toFiniteNumber(value)
  return numberValue !== undefined && numberValue >= 0 ? numberValue : undefined
}

const HEX_COLOR_PATTERN = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/
const PERCENT_PATTERN = /^\d+(?:\.\d+)?%$/

const isHexColor = (value: unknown): value is string => {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value)
}

const isPercentString = (value: unknown): value is `${number}%` => {
  return typeof value === 'string' && PERCENT_PATTERN.test(value)
}

const ALLOWED_FIT_VALUES: RecusUiImageFit[] = [
  'cover',
  'contain',
  'fill',
  'none',
  'scale-down',
]

const ALLOWED_POSITION_VALUES: RecusUiImagePosition[] = [
  'top',
  'bottom',
  'left',
  'right',
  'center',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]

const ALLOWED_BUTTON_VARIANTS: RecusUiButtonVariant[] = [
  'primary',
  'secondary',
  'ghost',
  'link',
]

const ALLOWED_LAYER_POSITIONS: RecusUiLayerPosition[] = ['freeform', 'flow']

const ALLOWED_FONT_WEIGHTS: RecusUiButtonFontWeight[] = [
  '400',
  '500',
  '600',
  '700',
  '800',
]

const DEFAULT_BUTTON_LAYOUT: RecusUiLayerLayout = {
  position: 'freeform',
  x: '25%',
  y: '45%',
  width: '50%',
  height: 48,
  zIndex: 1,
}

const DEFAULT_BUTTON_STYLE: RecusUiButtonStyle = {
  background: {
    type: 'solid',
    color: '#E5E7EB',
  },
  textColor: '#111111',
  borderColor: '#D1D5DB',
  borderWidth: 1,
  borderRadius: 8,
  fontSize: 14,
  fontWeight: '500',
}

const toImageFit = (value: unknown): RecusUiImageFit | undefined => {
  return typeof value === 'string' && (ALLOWED_FIT_VALUES as string[]).includes(value)
    ? (value as RecusUiImageFit)
    : undefined
}

const toImagePosition = (value: unknown): RecusUiImagePosition | undefined => {
  return typeof value === 'string' &&
    (ALLOWED_POSITION_VALUES as string[]).includes(value)
    ? (value as RecusUiImagePosition)
    : undefined
}

const toCanvas = (value: unknown): RecusUiCanvas => {
  if (!isRecord(value)) {
    return { width: 0, height: 0 }
  }

  return {
    width: toFiniteNumber(value.width) ?? 0,
    height: toFiniteNumber(value.height) ?? 0,
    device: toString(value.device),
  }
}

const toGradientStop = (value: unknown): RecusUiGradientStop | null => {
  if (!isRecord(value)) return null
  const color = toString(value.color)
  const position = toFiniteNumber(value.position)
  if (!color || position === undefined) return null
  return { color, position }
}

const toLinearGradient = (value: unknown): RecusUiLinearGradient | null => {
  if (!isRecord(value)) return null
  if (value.type !== 'linear') return null

  const rawStops = Array.isArray(value.stops) ? value.stops : []
  const stops = rawStops
    .map(toGradientStop)
    .filter((stop): stop is RecusUiGradientStop => !!stop)

  if (stops.length < 2) return null

  return {
    type: 'linear',
    angle: toFiniteNumber(value.angle) ?? 0,
    stops,
  }
}

const toButtonVariant = (value: unknown): RecusUiButtonVariant => {
  return typeof value === 'string' &&
    (ALLOWED_BUTTON_VARIANTS as string[]).includes(value)
    ? (value as RecusUiButtonVariant)
    : 'secondary'
}

const toLayerPosition = (value: unknown): RecusUiLayerPosition => {
  return typeof value === 'string' &&
    (ALLOWED_LAYER_POSITIONS as string[]).includes(value)
    ? (value as RecusUiLayerPosition)
    : DEFAULT_BUTTON_LAYOUT.position
}

const toLayerDimension = (
  value: unknown,
  fallback: RecusUiLayerDimension,
): RecusUiLayerDimension => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }

  if (isPercentString(value) || value === 'fill' || value === 'hug') {
    return value
  }

  return fallback
}

const toButtonLinearGradient = (
  value: Record<string, unknown>,
): RecusUiButtonBackground | null => {
  const rawStops = Array.isArray(value.stops) ? value.stops : []
  const stops = rawStops
    .map(toGradientStop)
    .filter((stop): stop is RecusUiGradientStop => {
      return !!stop && isHexColor(stop.color) && stop.position >= 0 && stop.position <= 1
    })

  if (stops.length < 2) return null

  return {
    type: 'linear-gradient',
    angle: toFiniteNumber(value.angle) ?? 0,
    stops,
  }
}

const toButtonBackground = (value: unknown): RecusUiButtonBackground => {
  if (!isRecord(value)) return DEFAULT_BUTTON_STYLE.background

  if (value.type === 'solid' && isHexColor(value.color)) {
    return {
      type: 'solid',
      color: value.color,
    }
  }

  if (value.type === 'linear-gradient') {
    return toButtonLinearGradient(value) ?? DEFAULT_BUTTON_STYLE.background
  }

  return DEFAULT_BUTTON_STYLE.background
}

const toFontWeight = (value: unknown): RecusUiButtonFontWeight => {
  return typeof value === 'string' &&
    (ALLOWED_FONT_WEIGHTS as string[]).includes(value)
    ? (value as RecusUiButtonFontWeight)
    : DEFAULT_BUTTON_STYLE.fontWeight
}

const toShadow = (value: unknown): RecusUiShadow | null | undefined => {
  if (value === null) return null
  if (!isRecord(value)) return undefined

  return {
    color: isHexColor(value.color) ? value.color : '#000000',
    x: toFiniteNumber(value.x) ?? 0,
    y: toFiniteNumber(value.y) ?? 0,
    blur: toNonNegativeNumber(value.blur) ?? 0,
  }
}

const toButtonLayout = (value: unknown): RecusUiLayerLayout => {
  if (!isRecord(value)) return DEFAULT_BUTTON_LAYOUT

  return {
    position: toLayerPosition(value.position),
    x: isPercentString(value.x) ? value.x : DEFAULT_BUTTON_LAYOUT.x,
    y: isPercentString(value.y) ? value.y : DEFAULT_BUTTON_LAYOUT.y,
    width: toLayerDimension(value.width, DEFAULT_BUTTON_LAYOUT.width),
    height: toLayerDimension(value.height, DEFAULT_BUTTON_LAYOUT.height),
    zIndex: toFiniteNumber(value.zIndex) ?? DEFAULT_BUTTON_LAYOUT.zIndex,
  }
}

const toButtonStyle = (value: unknown): RecusUiButtonStyle => {
  if (!isRecord(value)) return DEFAULT_BUTTON_STYLE

  const shadow = toShadow(value.shadow)

  return {
    background: toButtonBackground(value.background),
    textColor: isHexColor(value.textColor)
      ? value.textColor
      : DEFAULT_BUTTON_STYLE.textColor,
    borderColor: isHexColor(value.borderColor)
      ? value.borderColor
      : DEFAULT_BUTTON_STYLE.borderColor,
    borderWidth: toNonNegativeNumber(value.borderWidth) ?? DEFAULT_BUTTON_STYLE.borderWidth,
    borderRadius: toNonNegativeNumber(value.borderRadius) ?? DEFAULT_BUTTON_STYLE.borderRadius,
    fontSize: toNonNegativeNumber(value.fontSize) ?? DEFAULT_BUTTON_STYLE.fontSize,
    fontWeight: toFontWeight(value.fontWeight),
    shadow,
  }
}

const toButtonEvents = (value: unknown): RecusUiButtonEvents | undefined => {
  if (!isRecord(value)) return undefined
  if (!Array.isArray(value.onTap)) return undefined

  const onTap = value.onTap.filter(isRecord)
  return onTap.length > 0 ? { onTap } : undefined
}

const toBackground = (value: unknown): RecusUiBackground | null => {
  if (!isRecord(value)) return null

  if (value.type === 'gradient') {
    const gradient = toLinearGradient(value.gradient)
    if (!gradient) return null
    return { type: 'gradient', gradient }
  }

  if (value.type === 'solid') {
    const color = toString(value.color)
    if (!color) return null
    return { type: 'solid', color } satisfies RecusUiSolidBackground
  }

  if (value.type === 'image' && isRecord(value.image)) {
    const url = toString(value.image.url)
    if (!url) return null
    return {
      type: 'image',
      image: {
        url,
        fit: toImageFit(value.image.fit),
        position: toImagePosition(value.image.position),
      },
    } satisfies RecusUiImageBackground
  }

  return null
}

const toButtonLayer = (value: Record<string, unknown>, index: number): RecusUiButtonLayer | null => {
  if (value.type !== 'button') return null

  return {
    id: toString(value.id) ?? `button-${index + 1}`,
    type: 'button',
    label: toString(value.label) ?? 'Button',
    disabled: typeof value.disabled === 'boolean' || typeof value.disabled === 'string'
      ? value.disabled
      : false,
    variant: toButtonVariant(value.variant),
    layout: toButtonLayout(value.layout),
    style: toButtonStyle(value.style),
    events: toButtonEvents(value.events),
  }
}

const toLayer = (value: unknown, index: number): RecusUiLayer | null => {
  if (!isRecord(value)) return null

  return toButtonLayer(value, index)
}

const toLayers = (value: unknown): RecusUiLayer[] => {
  if (!Array.isArray(value)) return []
  return value
    .map(toLayer)
    .filter((layer): layer is RecusUiLayer => !!layer)
}

/**
 * Best-effort parser that turns a loose JSON object into a strictly
 * typed {@link RecusUiSchema}. Returns `null` when required fields
 * (like `background`) are missing or malformed so that the engine can
 * render a clear fallback instead of crashing at runtime.
 */
export const normalizeRecusUi = (value: RecusUi | unknown): RecusUiSchema | null => {
  if (!isRecord(value)) return null

  const background = toBackground(value.background)
  if (!background) return null

  return {
    schemaVersion: toString(value.schemaVersion) ?? '1.0',
    canvas: toCanvas(value.canvas),
    background,
    layers: toLayers(value.layers),
  }
}
