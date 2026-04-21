import { Alert } from 'react-native';
import {
  getRecusSdkKey,
  RECUS_API_DEFAULT_CONFIG,
  RECUS_SDK_KEY_HEADER,
} from '../common'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type JsonObject = Record<string, unknown>

type RequestOptions<TBody = unknown> = {
  method?: HttpMethod
  path: string
  body?: TBody
  headers?: Record<string, string>
  sdkKey?: string
  /**
   * Deprecated: all requests now require SDK auth.
   * Passing false will throw before any network call is made.
   */
  withSdkAuth?: boolean
  signal?: AbortSignal
  baseUrl?: string
  timeoutMs?: number
  enableLogging?: boolean
}

type AppSdkRequestOptions<TBody = unknown> = Omit<
  RequestOptions<TBody>,
  'withSdkAuth'
>

export class ApiError extends Error {
  readonly status: number
  readonly data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value)

const buildUrl = (path: string, baseUrl: string): string => {
  if (isAbsoluteUrl(path)) return path

  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

const safeParseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text()
  if (!text) return undefined

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

const REDACTED_HEADER_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  RECUS_SDK_KEY_HEADER.toLowerCase(),
])

const sanitizeHeadersForLogging = (
  headers: Record<string, string>,
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      const isSensitive = REDACTED_HEADER_KEYS.has(key.toLowerCase())
      return [key, isSensitive ? '***redacted***' : value]
    }),
  )
}

const shrinkForLogging = (payload: unknown): unknown => {
  if (typeof payload === 'string') {
    return payload.length > 500 ? `${payload.slice(0, 500)}...<truncated>` : payload
  }
  return payload
}

const createRequestSignal = (
  timeoutMs: number,
  externalSignal?: AbortSignal,
): {
  signal: AbortSignal | undefined
  cleanup: () => void
  didTimeout: () => boolean
} => {
  if (!externalSignal && timeoutMs <= 0) {
    return {
      signal: undefined,
      cleanup: () => undefined,
      didTimeout: () => false,
    }
  }

  const timeoutController = new AbortController()
  let timedOut = false
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const onExternalAbort = () => {
    timeoutController.abort(externalSignal?.reason)
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      onExternalAbort()
    } else {
      externalSignal.addEventListener('abort', onExternalAbort)
    }
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true
      timeoutController.abort(new Error(`[Recus API] Request timed out after ${timeoutMs}ms.`))
    }, timeoutMs)
  }

  return {
    signal: timeoutController.signal,
    cleanup: () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort)
      }
    },
    didTimeout: () => timedOut,
  }
}

export async function request<TResponse, TBody = unknown>({
  method = 'GET',
  path,
  body,
  headers,
  sdkKey,
  withSdkAuth = true,
  signal,
  baseUrl = RECUS_API_DEFAULT_CONFIG.apiBaseUrl,
  timeoutMs = RECUS_API_DEFAULT_CONFIG.timeoutMs,
  enableLogging = RECUS_API_DEFAULT_CONFIG.enableLogging,
}: RequestOptions<TBody>): Promise<TResponse> {
 ;
  const resolvedHeaders: Record<string, string> = {
    Accept: 'application/json',
    'x-recus-app': RECUS_API_DEFAULT_CONFIG.appName,
    ...headers,
  }

  if (body !== undefined) {
    resolvedHeaders['Content-Type'] = 'application/json'
  }

  if (!withSdkAuth) {
    throw new Error(
      '[Recus API] SDK auth is required for all requests. Unauthenticated requests are disabled.',
    )
  }

  const resolvedSdkKey = sdkKey ?? getRecusSdkKey()
  if (!resolvedSdkKey) {
    throw new Error('[Recus API] SDK key is required for all requests.')
  }
  resolvedHeaders[RECUS_SDK_KEY_HEADER] = resolvedSdkKey

  const requestBody = body !== undefined ? JSON.stringify(body) : undefined
  const url = buildUrl(path, baseUrl)
  const startedAt = Date.now()

  if (enableLogging) {
    console.info(`[Recus API][${method}] Request`, {
      url,
      timeoutMs,
      headers: sanitizeHeadersForLogging(resolvedHeaders),
      body: shrinkForLogging(body),
    })
  }

  const { signal: requestSignal, cleanup, didTimeout } = createRequestSignal(
    timeoutMs,
    signal,
  )

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: resolvedHeaders,
      body: requestBody,
      signal: requestSignal,
    })
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const timedOut = didTimeout()

    if (enableLogging) {
      console.error(`[Recus API][${method}] Request failed`, {
        url,
        durationMs,
        timeoutMs,
        timedOut,
        error,
      })
    }

    if (timedOut) {
      throw new Error(`[Recus API] Request timed out after ${timeoutMs}ms.`)
    }

    throw error
  } finally {
    cleanup()
  }

  const data = await safeParseJson(response)
  const durationMs = Date.now() - startedAt

  if (enableLogging) {
    const logData = {
      url,
      status: response.status,
      ok: response.ok,
      durationMs,
      data: shrinkForLogging(data),
    }

    if (response.ok) {
      console.info(`[Recus API][${method}] Response`, logData)
    } else {
      console.error(`[Recus API][${method}] Response`, logData)
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, data)
  }

  return data as TResponse
}

export function appSdkRequest<TResponse, TBody = unknown>(
  options: AppSdkRequestOptions<TBody>,
): Promise<TResponse> {
  return request<TResponse, TBody>({
    ...options,
    withSdkAuth: true,
  })
}

export type { JsonObject }
