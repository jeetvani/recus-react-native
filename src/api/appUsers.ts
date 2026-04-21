import { appSdkRequest } from './client'
import { apiRoutes } from './routes'

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
}

type CreateAppUserParams = {
  sdkKey?: string
  input: CreateAppUserInput
}

export const createAppUser = ({ sdkKey, input }: CreateAppUserParams) => {
  return appSdkRequest<CreateAppUserResponse, CreateAppUserInput>({
    method: 'POST',
    path: apiRoutes.appSdk.appUsers(),
    body: input,
    sdkKey,
  })
}
