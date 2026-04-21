import { useMutation } from '@tanstack/react-query'
import {
  createAppUser,
  CreateAppUserInput,
  CreateAppUserResponse,
} from '../../api/appUsers'
import { queryKeys } from '../../query/keys'
import { useRecusUsersStore } from '../../store/recusUsersStore'

export const useCreateAppUser = () => {
  const upsertRecusUser = useRecusUsersStore(state => state.upsertUser)

  return useMutation<CreateAppUserResponse, Error, CreateAppUserInput>({
    mutationKey: queryKeys.appUsers.create,
    mutationFn: input => createAppUser({ input }),
    onSuccess: (response, variables) => {
      const fallbackUserId = typeof variables.appUserId === 'string' ? variables.appUserId.trim() : undefined
      const responseUserId =
        typeof response.appUser.appUserId === 'string'
          ? response.appUser.appUserId.trim()
          : undefined
      const userId = responseUserId || fallbackUserId
      if (!userId) return
      upsertRecusUser(userId, response.appUser)
    },
  })
}
