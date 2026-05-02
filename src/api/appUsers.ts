import { appSdkRequest } from './client'
import { apiRoutes } from './routes'
import { AppOnboardingFlow, normalizeAppOnboardingFlow } from './appOnboarding'
import {
  AppUserOnboardingRecord,
  normalizeAppUserOnboardingDataResponse,
  RawGetAppUserOnboardingDataResponse,
} from './appUserOnboardingData'

export type AppUserMeta = Record<string, unknown>

export type CreateAppUserInput = {
  appUserId?: string | null
  name: string
  email: string
  profilePictureUrl?: string | null
  userMeta?: AppUserMeta
}

export type AppUser = {
  id: string
  appId: string
  appUserId: string | null
  name: string
  email: string
  profilePictureUrl: string | null
  userMeta: AppUserMeta
  createdAt: string | null
  updatedAt: string | null
}

export type CreateAppUserResponse = {
  appUser: AppUser
  userOnboardingData?: AppUserOnboardingRecord
  onboardingFlow?: AppOnboardingFlow
}

type CreateAppUserParams = {
  sdkKey?: string
  input: CreateAppUserInput
}

type RawCreateAppUserResponse = Omit<
  CreateAppUserResponse,
  'onboardingFlow' | 'userOnboardingData'
> & {
  userOnboardingData?: RawGetAppUserOnboardingDataResponse['userOnboardingData']
  onboardingFlow?: Omit<AppOnboardingFlow, 'data'> & {
    data: Record<string, unknown>
  }
}

export const createAppUser = async ({
  sdkKey,
  input,
}: CreateAppUserParams): Promise<CreateAppUserResponse> => {
  const response = await appSdkRequest<RawCreateAppUserResponse, CreateAppUserInput>({
    method: 'POST',
    path: apiRoutes.appSdk.appUsers(),
    body: input,
    sdkKey,
  })

  return {
    ...response,
    userOnboardingData: response.userOnboardingData
      ? normalizeAppUserOnboardingDataResponse({
          userOnboardingData: response.userOnboardingData,
        }).userOnboardingData
      : undefined,
    onboardingFlow: response.onboardingFlow
      ? normalizeAppOnboardingFlow(response.onboardingFlow)
      : undefined,
  }
}
