const toPositiveNumber = (
  value: string | undefined,
  fallback: number,
): number => {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

export const RECUS_API_DEFAULT_CONFIG = {
  appName: 'recus-app',
  apiBaseUrl:  'http://localhost:4000',
  timeoutMs: toPositiveNumber(process.env.EXPO_PUBLIC_RECUS_API_TIMEOUT_MS, 15000),
  enableLogging: toBoolean(process.env.EXPO_PUBLIC_RECUS_API_ENABLE_LOGGING, true),
  sdkKeyHeader: process.env.EXPO_PUBLIC_RECUS_SDK_KEY_HEADER ?? 'x-sdk-key',
} as const

export const RECUS_API_BASE_URL = RECUS_API_DEFAULT_CONFIG.apiBaseUrl

export const RECUS_SDK_KEY_HEADER = RECUS_API_DEFAULT_CONFIG.sdkKeyHeader

let recusSdkKey: string | undefined

export const setRecusSdkKey = (sdkKey?: string) => {
  recusSdkKey = sdkKey
}
 
export const getRecusSdkKey = () => recusSdkKey
  