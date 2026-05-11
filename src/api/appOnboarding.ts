import { appSdkRequest, JsonObject } from './client'
import { apiRoutes } from './routes'

export type AppOnboardingInputType =
  | 'text'
  | 'password'
  | 'boolean'
  | 'email'
  | 'number'
  | 'phone'
  | 'tel'
  | 'url'
  | 'date'
  | 'textarea'
  | 'radio'

export type AppOnboardingValidationRule = {
  type: string
  value?: unknown
  message?: string
}

export type AppOnboardingInputConfig = {
  id: string
  label: string
  type: AppOnboardingInputType
  required: boolean
  placeholder?: string
  maxLength?: number
  minLength?: number
  options?: string[]
  defaultValue?: unknown
  validation?: {
    rules?: AppOnboardingValidationRule[]
  }
  metadata?: Record<string, unknown>
}

export type AppOnboardingTransition = {
  to: string
  label?: string
  backAllowed?: boolean
  condition?: string | null
  analytics?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type AppOnboardingUi = Record<string, unknown>

export type AppOnboardingScreenConfig = {
  id: string
  title?: string
  subtitle?: string
  html?: boolean
  inputs?: AppOnboardingInputConfig[]
  transitions?: AppOnboardingTransition[]
  events?: Record<string, unknown>
  analytics?: Record<string, unknown>
  ui?: AppOnboardingUi | null
  conditions?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

export type AppOnboardingData = {
  screens: AppOnboardingScreenConfig[]
}

export type AppOnboardingFlow = {
  id: string
  appId: string
  name: string
  data: AppOnboardingData
  createdAt: string | null
  updatedAt: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const toNumberOrUndefined = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const toInputType = (value: unknown): AppOnboardingInputType => {
  if (
    value === 'password' ||
    value === 'boolean' ||
    value === 'email' ||
    value === 'number' ||
    value === 'phone' ||
    value === 'tel' ||
    value === 'url' ||
    value === 'date' ||
    value === 'textarea' ||
    value === 'radio'
  ) {
    return value
  }

  return 'text'
}

const toInputConfig = (value: unknown): AppOnboardingInputConfig | null => {
  if (!isRecord(value) || typeof value.id !== 'string') return null

  return {
    id: value.id,
    label: typeof value.label === 'string' ? value.label : value.id,
    type: toInputType(value.type),
    required: typeof value.required === 'boolean' ? value.required : false,
    placeholder: typeof value.placeholder === 'string' ? value.placeholder : undefined,
    maxLength: toNumberOrUndefined(value.maxLength),
    minLength: toNumberOrUndefined(value.minLength),
    options: Array.isArray(value.options)
      ? value.options.filter((option): option is string => typeof option === 'string')
      : undefined,
    defaultValue: value.defaultValue,
    validation: isRecord(value.validation) && Array.isArray(value.validation.rules)
      ? {
        rules: value.validation.rules
          .filter(isRecord)
          .map(rule => ({
            type: typeof rule.type === 'string' ? rule.type : '',
            value: rule.value,
            message: typeof rule.message === 'string' ? rule.message : undefined,
          }))
          .filter(rule => rule.type.length > 0),
      }
      : undefined,
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  }
}

const toTransition = (value: unknown): AppOnboardingTransition | null => {
  if (!isRecord(value) || typeof value.to !== 'string') return null

  return {
    to: value.to,
    label: typeof value.label === 'string' ? value.label : undefined,
    backAllowed: typeof value.backAllowed === 'boolean' ? value.backAllowed : undefined,
    condition: typeof value.condition === 'string' || value.condition === null
      ? value.condition
      : undefined,
    analytics: isRecord(value.analytics) ? value.analytics : undefined,
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  }
}

const toScreenConfig = (value: unknown): AppOnboardingScreenConfig | null => {
  if (!isRecord(value) || typeof value.id !== 'string') return null

  const rawInputs = Array.isArray(value.inputs) ? value.inputs : []
  const rawTransitions = Array.isArray(value.transitions) ? value.transitions : []

  return {
    id: value.id,
    title: typeof value.title === 'string' ? value.title : undefined,
    subtitle: typeof value.subtitle === 'string' ? value.subtitle : undefined,
    html: typeof value.html === 'boolean' ? value.html : undefined,
    inputs: rawInputs.map(toInputConfig).filter((input): input is AppOnboardingInputConfig => !!input),
    transitions: rawTransitions
      .map(toTransition)
      .filter((transition): transition is AppOnboardingTransition => !!transition),
    events: isRecord(value.events) ? value.events : undefined,
    analytics: isRecord(value.analytics) ? value.analytics : undefined,
    ui: isRecord(value.ui) ? (value.ui as AppOnboardingUi) : null,
    conditions: isRecord(value.conditions) ? (value.conditions as Record<string, unknown>) : null,
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  }
}

const toOnboardingData = (value: JsonObject): AppOnboardingData => {
  const rawScreens = Array.isArray(value.screens) ? value.screens : []
  return {
    screens: rawScreens
      .map(toScreenConfig)
      .filter((screen): screen is AppOnboardingScreenConfig => !!screen),
  }
}

type GetAppOnboardingParams = {
  sdkKey?: string
}

export const normalizeAppOnboardingFlow = (
  response: Omit<AppOnboardingFlow, 'data'> & {
    data: JsonObject
  },
): AppOnboardingFlow => {
  return {
    ...response,
    data: toOnboardingData(response.data),
  }
}

export const getAppOnboarding = async ({
  sdkKey,
}: GetAppOnboardingParams = {}): Promise<AppOnboardingFlow> => {
  const response = await appSdkRequest<
    Omit<AppOnboardingFlow, 'data'> & {
      data: JsonObject
    }
  >({
    method: 'GET',
    path: apiRoutes.appSdk.onboarding(),
    sdkKey,
  })

  return normalizeAppOnboardingFlow(response)
}
