import { useMutation } from '@tanstack/react-query'
import {
  getAppUserOnboardingData,
  GetAppUserOnboardingDataResponse,
} from '../../api/appUserOnboardingData'
import { queryKeys } from '../../query/keys'
import { useAppUserOnboardingDataStore } from '../../store/appUserOnboardingDataStore'

export type GetAppUserOnboardingDataVariables = {
  sdkKey?: string
  appUserId: string
}

export const useGetAppUserOnboardingData = () => {
  const upsertOnboardingData = useAppUserOnboardingDataStore(state => state.upsertOnboardingData)

  return useMutation<
    GetAppUserOnboardingDataResponse,
    Error,
    GetAppUserOnboardingDataVariables
  >({
    mutationKey: queryKeys.appUsers.onboardingData,
    mutationFn: variables => getAppUserOnboardingData(variables),
    onSuccess: (response, variables) => {
      upsertOnboardingData(variables.appUserId, response.userOnboardingData)
    },
  })
}
