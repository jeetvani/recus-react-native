import { useMutation } from '@tanstack/react-query'
import {
  patchAppUserOnboardingData,
  PatchAppUserOnboardingDataResponse,
} from '../../api/appUserOnboardingData'
import type { JsonObject } from '../../api/client'
import { queryKeys } from '../../query/keys'
import { useAppUserOnboardingDataStore } from '../../store/appUserOnboardingDataStore'

export type UpdateAppUserOnboardingDataVariables = {
  sdkKey?: string
  appUserId: string
  onboardingData: JsonObject
  metadata?: JsonObject
}

export const useUpdateAppUserOnboardingData = () => {
  const upsertOnboardingData = useAppUserOnboardingDataStore(state => state.upsertOnboardingData)

  return useMutation<
    PatchAppUserOnboardingDataResponse,
    Error,
    UpdateAppUserOnboardingDataVariables
  >({
    mutationKey: queryKeys.appUsers.updateOnboardingData,
    mutationFn: variables => patchAppUserOnboardingData(variables),
    onSuccess: (response, variables) => {
      upsertOnboardingData(variables.appUserId, response.userOnboardingData)
    },
  })
}
