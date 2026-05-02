import { appSdkRequest, JsonObject } from './client'
import { apiRoutes } from './routes'
import { AppOnboardingFlow, normalizeAppOnboardingFlow } from './appOnboarding'

export type AppUserOnboardingRecord = {
  id: string
  appId: string
  userId: string
  appUserId: string | null
  onboardingFlowId: string | null
  onboardingData: JsonObject
  metadata: JsonObject
  createdAt: string | null
  updatedAt: string | null
}

export type GetAppUserOnboardingDataResponse = {
  userOnboardingData: AppUserOnboardingRecord
  onboardingFlow?: AppOnboardingFlow
}

type GetAppUserOnboardingDataParams = {
  sdkKey?: string
  appUserId: string
}

const toNullableString = (value: unknown): string | null => {
  return typeof value === 'string' ? value : null
}

const toJsonObject = (value: unknown): JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : {}
}

export type RawGetAppUserOnboardingDataResponse = Omit<
  GetAppUserOnboardingDataResponse,
  'onboardingFlow'
> & {
  onboardingFlow?: Omit<AppOnboardingFlow, 'data'> & {
    data: JsonObject
  }
}

export const normalizeAppUserOnboardingDataResponse = (
  response: RawGetAppUserOnboardingDataResponse,
): GetAppUserOnboardingDataResponse => {
  return {
    userOnboardingData: {
      ...response.userOnboardingData,
      appUserId: toNullableString(response.userOnboardingData.appUserId),
      onboardingFlowId: toNullableString(response.userOnboardingData.onboardingFlowId),
      onboardingData: toJsonObject(response.userOnboardingData.onboardingData),
      metadata: toJsonObject(response.userOnboardingData.metadata),
      createdAt: toNullableString(response.userOnboardingData.createdAt),
      updatedAt: toNullableString(response.userOnboardingData.updatedAt),
    },
    onboardingFlow: response.onboardingFlow
      ? normalizeAppOnboardingFlow(response.onboardingFlow)
      : undefined,
  }
}

export const getAppUserOnboardingData = async ({
  sdkKey,
  appUserId,
}: GetAppUserOnboardingDataParams): Promise<GetAppUserOnboardingDataResponse> => {
  const response = await appSdkRequest<RawGetAppUserOnboardingDataResponse>({
    method: 'GET',
    path: apiRoutes.appSdk.appUserOnboardingData(appUserId),
    sdkKey,
  })

  return normalizeAppUserOnboardingDataResponse(response)
}

export type PatchAppUserOnboardingDataResponse = GetAppUserOnboardingDataResponse

export type PatchAppUserOnboardingDataBody = {
  onboardingData: JsonObject
  metadata?: JsonObject
}

type PatchAppUserOnboardingDataParams = {
  sdkKey?: string
  appUserId: string
  onboardingData: JsonObject
  metadata?: JsonObject
}

export const patchAppUserOnboardingData = async ({
  sdkKey,
  appUserId,
  onboardingData,
  metadata,
}: PatchAppUserOnboardingDataParams): Promise<PatchAppUserOnboardingDataResponse> => {
  const response = await appSdkRequest<
    RawGetAppUserOnboardingDataResponse,
    PatchAppUserOnboardingDataBody
  >({
    method: 'PATCH',
    path: apiRoutes.appSdk.appUserOnboardingData(appUserId),
    body: metadata === undefined ? { onboardingData } : { onboardingData, metadata },
    sdkKey,
  })

  return normalizeAppUserOnboardingDataResponse(response)
}
