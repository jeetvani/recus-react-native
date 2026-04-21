import { useMutation } from '@tanstack/react-query'
import { AppOnboardingFlow, getAppOnboarding } from '../../api/appOnboarding'
import { queryKeys } from '../../query/keys'

export type GetAppOnboardingVariables = {
  sdkKey?: string
}

export const useGetAppOnboarding = () => {
  return useMutation<AppOnboardingFlow, Error, GetAppOnboardingVariables | undefined>({
    mutationKey: queryKeys.appSdk.onboarding,
    mutationFn: variables => getAppOnboarding({ sdkKey: variables?.sdkKey }),
  })
}
