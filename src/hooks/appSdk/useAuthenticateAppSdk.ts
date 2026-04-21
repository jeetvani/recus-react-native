import { useMutation } from '@tanstack/react-query'
import {
  authenticateAppSdk,
  AuthenticateAppSdkResponse,
} from '../../api/appSdk'
import { queryKeys } from '../../query/keys'

export type AuthenticateAppSdkVariables = {
  sdkKey?: string
}

export const useAuthenticateAppSdk = () => {
  return useMutation<
    AuthenticateAppSdkResponse,
    Error,
    AuthenticateAppSdkVariables | undefined
  >({
    mutationKey: queryKeys.appSdk.authenticate,
    mutationFn: variables => authenticateAppSdk({ sdkKey: variables?.sdkKey }),
  })
}
