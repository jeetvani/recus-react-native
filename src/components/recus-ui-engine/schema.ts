import {
  RecusUi,
  RecusUiBackground,
  RecusUiButtonBackground,
  RecusUiButtonEvents,
  RecusUiButtonFontWeight,
  RecusUiButtonLayer,
  RecusUiButtonStyle,
  RecusUiButtonType,
  RecusUiButtonVariant,
  RecusUiCanvas,
  RecusUiGradientStop,
  RecusUiImageBackground,
  RecusUiImageCrop,
  RecusUiImageFit,
  RecusUiImageLayer,
  RecusUiImageLayerStyle,
  RecusUiImagePosition,
  RecusUiImageShape,
  RecusUiLayerAnimation,
  RecusUiInputLayer,
  RecusUiInputLayerStyle,
  RecusUiInputType,
  RecusUiLayer,
  RecusUiLayerDimension,
  RecusUiLayerLayout,
  RecusUiLayerPosition,
  RecusUiLinearGradient,
  RecusUiRadialGradient,
  RecusUiSchema,
  RecusUiShadow,
  RecusUiSolidBackground,
  RecusUiTextAlign,
  RecusUiTextDecoration,
  RecusUiTextFontStyle,
  RecusUiTextLayer,
  RecusUiTextLayerStyle,
  RecusUiTextTransform,
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

const ALLOWED_BUTTON_TYPES: RecusUiButtonType[] = ['continue', 'skip', 'back']

const ALLOWED_LAYER_POSITIONS: RecusUiLayerPosition[] = ['freeform', 'flow']

const ALLOWED_IMAGE_SHAPES: RecusUiImageShape[] = [
  'rectangle',
  'rounded',
  'circle',
]

const ALLOWED_FONT_WEIGHTS: RecusUiButtonFontWeight[] = [
  '400',
  '500',
  '600',
  '700',
  '800',
]

const ALLOWED_INPUT_TYPES: RecusUiInputType[] = [
  'text',
  'password',
  'email',
  'number',
  'phone',
  'tel',
  'url',
  'date',
  'textarea',
  'boolean',
  'radio',
]

const ALLOWED_ANIMATION_PRESETS: RecusUiLayerAnimation['preset'][] = [
  'fade-in',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'zoom-in',
  'pop',
  'bounce',
  'pulse',
]

const ALLOWED_ANIMATION_EASINGS: RecusUiLayerAnimation['easing'][] = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
]

const ALLOWED_TEXT_ALIGNS: RecusUiTextAlign[] = [
  'left',
  'center',
  'right',
  'justify',
]

const ALLOWED_TEXT_FONT_STYLES: RecusUiTextFontStyle[] = ['normal', 'italic']

const ALLOWED_TEXT_TRANSFORMS: RecusUiTextTransform[] = [
  'none',
  'uppercase',
  'lowercase',
  'capitalize',
]

const ALLOWED_TEXT_DECORATIONS: RecusUiTextDecoration[] = [
  'none',
  'underline',
  'line-through',
  'underline line-through',
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

const DEFAULT_IMAGE_LAYOUT: RecusUiLayerLayout = {
  position: 'freeform',
  x: '25%',
  y: '25%',
  width: '50%',
  height: 200,
  zIndex: 1,
}

const DEFAULT_IMAGE_STYLE: RecusUiImageLayerStyle = {
  opacity: 1,
  objectFit: 'cover',
  borderColor: '#000000',
  borderWidth: 0,
  borderRadius: 0,
  objectPosition: 'center',
}

const DEFAULT_INPUT_LAYOUT: RecusUiLayerLayout = {
  position: 'freeform',
  x: '10%',
  y: '45%',
  width: '80%',
  height: 48,
  zIndex: 1,
}

const DEFAULT_TEXT_LAYOUT: RecusUiLayerLayout = {
  position: 'freeform',
  x: '5%',
  y: '5%',
  width: '90%',
  height: 'hug',
  zIndex: 1,
}

const DEFAULT_TEXT_STYLE: RecusUiTextLayerStyle = {
  color: '#111111',
  opacity: 1,
  fontSize: 16,
  fontStyle: 'normal',
  textAlign: 'left',
  fontFamily: undefined,
  fontWeight: '400',
  lineHeight: 1.4,
  letterSpacing: 0,
  textTransform: 'none',
  textDecoration: 'none',
}

const DEFAULT_INPUT_STYLE: RecusUiInputLayerStyle = {
  fontSize: 14,
  labelSize: 12,
  textColor: '#111827',
  labelColor: '#374151',
  borderColor: '#E5E7EB',
  borderWidth: 1,
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  placeholderColor: '#9CA3AF',
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

const toImageShape = (value: unknown): RecusUiImageShape | undefined => {
  return typeof value === 'string' && (ALLOWED_IMAGE_SHAPES as string[]).includes(value)
    ? (value as RecusUiImageShape)
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

const toRadialGradient = (value: unknown): RecusUiRadialGradient | null => {
  if (!isRecord(value)) return null
  if (value.type !== 'radial') return null

  const rawStops = Array.isArray(value.stops) ? value.stops : []
  const stops = rawStops
    .map(toGradientStop)
    .filter((stop): stop is RecusUiGradientStop => !!stop)

  if (stops.length < 2) return null

  return {
    type: 'radial',
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

const toButtonType = (value: unknown): RecusUiButtonType | undefined => {
  return typeof value === 'string' &&
    (ALLOWED_BUTTON_TYPES as string[]).includes(value)
    ? (value as RecusUiButtonType)
    : undefined
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

const toInputType = (value: unknown): RecusUiInputType => {
  return typeof value === 'string' &&
    (ALLOWED_INPUT_TYPES as string[]).includes(value)
    ? (value as RecusUiInputType)
    : 'text'
}

const toAnimation = (value: unknown): RecusUiLayerAnimation | undefined => {
  if (!isRecord(value)) return undefined
  const preset = typeof value.preset === 'string' &&
    (ALLOWED_ANIMATION_PRESETS as string[]).includes(value.preset)
    ? (value.preset as RecusUiLayerAnimation['preset'])
    : undefined
  if (!preset) return undefined

  const easing = typeof value.easing === 'string' &&
    (ALLOWED_ANIMATION_EASINGS as string[]).includes(value.easing)
    ? (value.easing as RecusUiLayerAnimation['easing'])
    : 'ease-out'

  return {
    preset,
    durationMs: toNonNegativeNumber(value.durationMs) ?? 300,
    delayMs: toNonNegativeNumber(value.delayMs) ?? 0,
    easing,
  }
}

const toTextAlign = (value: unknown): RecusUiTextAlign => {
  return typeof value === 'string' &&
    (ALLOWED_TEXT_ALIGNS as string[]).includes(value)
    ? (value as RecusUiTextAlign)
    : DEFAULT_TEXT_STYLE.textAlign
}

const toTextFontStyle = (value: unknown): RecusUiTextFontStyle => {
  return typeof value === 'string' &&
    (ALLOWED_TEXT_FONT_STYLES as string[]).includes(value)
    ? (value as RecusUiTextFontStyle)
    : DEFAULT_TEXT_STYLE.fontStyle
}

const toTextTransform = (value: unknown): RecusUiTextTransform => {
  return typeof value === 'string' &&
    (ALLOWED_TEXT_TRANSFORMS as string[]).includes(value)
    ? (value as RecusUiTextTransform)
    : DEFAULT_TEXT_STYLE.textTransform
}

const toTextDecoration = (value: unknown): RecusUiTextDecoration => {
  return typeof value === 'string' &&
    (ALLOWED_TEXT_DECORATIONS as string[]).includes(value)
    ? (value as RecusUiTextDecoration)
    : DEFAULT_TEXT_STYLE.textDecoration
}

/**
 * Web exports `fontFamily` as a CSS fallback list (e.g.
 * `"Inter, system-ui, -apple-system, sans-serif"`). React Native does
 * NOT parse fallback lists — passing the whole string fails silently and
 * triggers slow-path glyph lookups on iOS. Strip to the first declared
 * family, drop generic CSS keywords, and fall back to system font when
 * we can't be sure the family is registered with the runtime.
 */
const toTextFontFamily = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const first = value.split(',')[0]?.trim().replace(/^["']|["']$/g, '')
  if (!first) return undefined
  const lowered = first.toLowerCase()
  const cssGenerics = new Set([
    'system-ui',
    '-apple-system',
    'blinkmacsystemfont',
    'sans-serif',
    'serif',
    'monospace',
    'cursive',
    'fantasy',
    'inherit',
    'initial',
    'unset',
  ])
  if (cssGenerics.has(lowered)) return undefined
  return first
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

const toLayerLayout = (
  value: unknown,
  fallback: RecusUiLayerLayout,
): RecusUiLayerLayout => {
  if (!isRecord(value)) return fallback

  return {
    position: toLayerPosition(value.position),
    x: isPercentString(value.x) ? value.x : fallback.x,
    y: isPercentString(value.y) ? value.y : fallback.y,
    width: toLayerDimension(value.width, fallback.width),
    height: toLayerDimension(value.height, fallback.height),
    zIndex: toFiniteNumber(value.zIndex) ?? fallback.zIndex,
  }
}

const toButtonLayout = (value: unknown): RecusUiLayerLayout => {
  return toLayerLayout(value, DEFAULT_BUTTON_LAYOUT)
}

const toImageLayout = (value: unknown): RecusUiLayerLayout => {
  return toLayerLayout(value, DEFAULT_IMAGE_LAYOUT)
}

const toInputLayout = (value: unknown): RecusUiLayerLayout => {
  return toLayerLayout(value, DEFAULT_INPUT_LAYOUT)
}

const toTextLayout = (value: unknown): RecusUiLayerLayout => {
  return toLayerLayout(value, DEFAULT_TEXT_LAYOUT)
}

const toImageCrop = (value: unknown): RecusUiImageCrop | undefined => {
  if (!isRecord(value)) return undefined

  return {
    top: toNonNegativeNumber(value.top) ?? 0,
    left: toNonNegativeNumber(value.left) ?? 0,
    right: toNonNegativeNumber(value.right) ?? 0,
    bottom: toNonNegativeNumber(value.bottom) ?? 0,
  }
}

const toAspectRatio = (value: unknown): RecusUiImageLayerStyle['aspectRatio'] => {
  if (value === 'free') return 'free'
  const numberValue = toNonNegativeNumber(value)
  return numberValue && numberValue > 0 ? numberValue : undefined
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

const toImageStyle = (value: unknown): RecusUiImageLayerStyle => {
  if (!isRecord(value)) return DEFAULT_IMAGE_STYLE

  return {
    crop: toImageCrop(value.crop),
    shape: toImageShape(value.shape),
    opacity: Math.min(1, toNonNegativeNumber(value.opacity) ?? DEFAULT_IMAGE_STYLE.opacity),
    objectFit: toImageFit(value.objectFit) ?? DEFAULT_IMAGE_STYLE.objectFit,
    aspectRatio: toAspectRatio(value.aspectRatio),
    borderColor: isHexColor(value.borderColor)
      ? value.borderColor
      : DEFAULT_IMAGE_STYLE.borderColor,
    borderWidth: toNonNegativeNumber(value.borderWidth) ?? DEFAULT_IMAGE_STYLE.borderWidth,
    borderRadius: toNonNegativeNumber(value.borderRadius) ?? DEFAULT_IMAGE_STYLE.borderRadius,
    objectPosition: toImagePosition(value.objectPosition) ?? DEFAULT_IMAGE_STYLE.objectPosition,
    shadow: toShadow(value.shadow),
  }
}

const toInputStyle = (value: unknown): RecusUiInputLayerStyle => {
  if (!isRecord(value)) return DEFAULT_INPUT_STYLE
  const optionStyle = isRecord(value.optionStyle)
    ? {
      selected: isRecord(value.optionStyle.selected)
        ? {
          backgroundColor: isHexColor(value.optionStyle.selected.backgroundColor)
            ? value.optionStyle.selected.backgroundColor
            : undefined,
          textColor: isHexColor(value.optionStyle.selected.textColor)
            ? value.optionStyle.selected.textColor
            : undefined,
          borderColor: isHexColor(value.optionStyle.selected.borderColor)
            ? value.optionStyle.selected.borderColor
            : undefined,
        }
        : undefined,
      unselected: isRecord(value.optionStyle.unselected)
        ? {
          backgroundColor: isHexColor(value.optionStyle.unselected.backgroundColor)
            ? value.optionStyle.unselected.backgroundColor
            : undefined,
          textColor: isHexColor(value.optionStyle.unselected.textColor)
            ? value.optionStyle.unselected.textColor
            : undefined,
          borderColor: isHexColor(value.optionStyle.unselected.borderColor)
            ? value.optionStyle.unselected.borderColor
            : undefined,
        }
        : undefined,
      borderWidth: toNonNegativeNumber(value.optionStyle.borderWidth),
      borderRadius: toNonNegativeNumber(value.optionStyle.borderRadius),
      gap: toNonNegativeNumber(value.optionStyle.gap),
    }
    : undefined

  return {
    fontSize: toNonNegativeNumber(value.fontSize) ?? DEFAULT_INPUT_STYLE.fontSize,
    labelSize: toNonNegativeNumber(value.labelSize) ?? DEFAULT_INPUT_STYLE.labelSize,
    textColor: isHexColor(value.textColor)
      ? value.textColor
      : DEFAULT_INPUT_STYLE.textColor,
    labelColor: isHexColor(value.labelColor)
      ? value.labelColor
      : DEFAULT_INPUT_STYLE.labelColor,
    borderColor: isHexColor(value.borderColor)
      ? value.borderColor
      : DEFAULT_INPUT_STYLE.borderColor,
    borderWidth: toNonNegativeNumber(value.borderWidth) ?? DEFAULT_INPUT_STYLE.borderWidth,
    borderRadius: toNonNegativeNumber(value.borderRadius) ?? DEFAULT_INPUT_STYLE.borderRadius,
    backgroundColor: isHexColor(value.backgroundColor)
      ? value.backgroundColor
      : DEFAULT_INPUT_STYLE.backgroundColor,
    placeholderColor: isHexColor(value.placeholderColor)
      ? value.placeholderColor
      : DEFAULT_INPUT_STYLE.placeholderColor,
    optionStyle,
  }
}

const toTextStyle = (value: unknown): RecusUiTextLayerStyle => {
  if (!isRecord(value)) return DEFAULT_TEXT_STYLE

  return {
    color: isHexColor(value.color) ? value.color : DEFAULT_TEXT_STYLE.color,
    opacity: Math.min(1, toNonNegativeNumber(value.opacity) ?? DEFAULT_TEXT_STYLE.opacity),
    fontSize: toNonNegativeNumber(value.fontSize) ?? DEFAULT_TEXT_STYLE.fontSize,
    fontStyle: toTextFontStyle(value.fontStyle),
    textAlign: toTextAlign(value.textAlign),
    fontFamily: toTextFontFamily(value.fontFamily),
    fontWeight: toFontWeight(value.fontWeight),
    lineHeight: toNonNegativeNumber(value.lineHeight) ?? DEFAULT_TEXT_STYLE.lineHeight,
    letterSpacing: toFiniteNumber(value.letterSpacing) ?? DEFAULT_TEXT_STYLE.letterSpacing,
    textTransform: toTextTransform(value.textTransform),
    textDecoration: toTextDecoration(value.textDecoration),
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
    const gradient = toLinearGradient(value.gradient) ?? toRadialGradient(value.gradient)
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
        overlay: isRecord(value.image.overlay)
          ? {
            color: isHexColor(value.image.overlay.color)
              ? value.image.overlay.color
              : '#000000',
            opacity: Math.min(
              1,
              toNonNegativeNumber(value.image.overlay.opacity) ?? 0,
            ),
          }
          : null,
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
    buttonType: toButtonType(value.buttonType),
    disabled: typeof value.disabled === 'boolean' || typeof value.disabled === 'string'
      ? value.disabled
      : false,
    variant: toButtonVariant(value.variant),
    layout: toButtonLayout(value.layout),
    animation: toAnimation(value.animation),
    style: toButtonStyle(value.style),
    events: toButtonEvents(value.events),
  }
}

const toImageLayer = (value: Record<string, unknown>, index: number): RecusUiImageLayer | null => {
  if (value.type !== 'image') return null
  if (!isRecord(value.source)) return null

  const url = toString(value.source.url)
  if (!url) return null

  return {
    id: toString(value.id) ?? `image-${index + 1}`,
    type: 'image',
    alt: toString(value.alt),
    source: {
      url,
      type: toString(value.source.type),
    },
    layout: toImageLayout(value.layout),
    animation: toAnimation(value.animation),
    style: toImageStyle(value.style),
  }
}

const toInputOption = (
  value: unknown,
  index: number,
): NonNullable<RecusUiInputLayer['options']>[number] | null => {
  if (typeof value === 'string') {
    return { id: `option-${index + 1}`, label: value, value }
  }

  if (!isRecord(value)) return null
  const optionValue = toString(value.value)
  if (!optionValue) return null

  return {
    id: toString(value.id) ?? `option-${index + 1}`,
    label: toString(value.label) ?? optionValue,
    value: optionValue,
  }
}

const toInputLayer = (value: Record<string, unknown>, index: number): RecusUiInputLayer | null => {
  if (value.type !== 'input') return null

  const id = toString(value.id) ?? `input-${index + 1}`

  return {
    id,
    type: 'input',
    label: toString(value.label),
    fieldId: toString(value.fieldId) ?? id,
    required: typeof value.required === 'boolean' ? value.required : false,
    inputType: toInputType(value.inputType),
    placeholder: toString(value.placeholder),
    options: Array.isArray(value.options)
      ? value.options
        .map(toInputOption)
        .filter((option): option is NonNullable<RecusUiInputLayer['options']>[number] => !!option)
      : undefined,
    selectionMode: value.selectionMode === 'multiple' ? 'multiple' : 'single',
    selectedValues: Array.isArray(value.selectedValues)
      ? value.selectedValues.filter((selected): selected is string => {
        return typeof selected === 'string'
      })
      : undefined,
    minLength: toNonNegativeNumber(value.minLength),
    maxLength: toNonNegativeNumber(value.maxLength),
    layout: toInputLayout(value.layout),
    animation: toAnimation(value.animation),
    style: toInputStyle(value.style),
  }
}

const toTextLayer = (value: Record<string, unknown>, index: number): RecusUiTextLayer | null => {
  if (value.type !== 'text') return null

  const content = toString(value.content)
  if (content === undefined) return null

  return {
    id: toString(value.id) ?? `text-${index + 1}`,
    type: 'text',
    content,
    layout: toTextLayout(value.layout),
    animation: toAnimation(value.animation),
    style: toTextStyle(value.style),
  }
}

const toLayer = (value: unknown, index: number): RecusUiLayer | null => {
  if (!isRecord(value)) return null

  return (
    toButtonLayer(value, index) ??
    toImageLayer(value, index) ??
    toInputLayer(value, index) ??
    toTextLayer(value, index)
  )
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
