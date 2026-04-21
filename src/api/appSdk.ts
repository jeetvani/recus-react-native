import { appSdkRequest } from './client'
import { apiRoutes } from './routes'

export type AppSdkAppInfo = {
  appId: string
  appName: string
}

export type AuthenticateAppSdkResponse = {
  app: AppSdkAppInfo
}

type AuthenticateAppSdkParams = {
  sdkKey?: string
}

export const authenticateAppSdk = ({ sdkKey }: AuthenticateAppSdkParams = {}) => {
  return appSdkRequest<AuthenticateAppSdkResponse>({
    method: 'POST',
    path: apiRoutes.appSdk.authenticate(),
    sdkKey,
  })
}
