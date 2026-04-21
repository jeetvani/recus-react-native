import { appSdkRequest, JsonObject } from './client'
import { apiRoutes } from './routes'

export type AppOnboardingInputType = 'text' | 'password' | 'boolean'

export type AppOnboardingInputConfig = {
  id: string
  label: string
  type: AppOnboardingInputType
  placeholder?: string
  maxLength?: number
  minLength?: number
}

export type AppOnboardingTransition = {
  to: string
  backAllowed?: boolean
}

export type AppOnboardingScreenConfig = {
  id: string
  title?: string
  subtitle?: string
  html?: boolean
  inputs?: AppOnboardingInputConfig[]
  transitions?: AppOnboardingTransition[]
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
  return value === 'password' || value === 'boolean' ? value : 'text'
}

const toInputConfig = (value: unknown): AppOnboardingInputConfig | null => {
  if (!isRecord(value) || typeof value.id !== 'string') return null

  return {
    id: value.id,
    label: typeof value.label === 'string' ? value.label : value.id,
    type: toInputType(value.type),
    placeholder: typeof value.placeholder === 'string' ? value.placeholder : undefined,
    maxLength: toNumberOrUndefined(value.maxLength),
    minLength: toNumberOrUndefined(value.minLength),
  }
}

const toTransition = (value: unknown): AppOnboardingTransition | null => {
  if (!isRecord(value) || typeof value.to !== 'string') return null

  return {
    to: value.to,
    backAllowed: typeof value.backAllowed === 'boolean' ? value.backAllowed : undefined,
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

  return {
    ...response,
    data: toOnboardingData(response.data),
  }
}
