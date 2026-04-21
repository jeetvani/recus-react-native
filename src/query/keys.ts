export const queryKeys = {
  appSdk: {
    authenticate: ['app-sdk', 'authenticate'] as const,
    onboarding: ['app-sdk', 'onboarding'] as const,
  },
  appUsers: {
    all: ['app-users'] as const,
    create: ['app-users', 'create'] as const,
    byAppUserId: (appUserId: string | null | undefined) =>
      ['app-users', 'by-app-user-id', appUserId ?? null] as const,
    onboardingData: ['app-users', 'onboarding-data'] as const,
    onboardingDataByAppUserId: (appUserId: string | null | undefined) =>
      ['app-users', 'onboarding-data', appUserId ?? null] as const,
    updateOnboardingData: ['app-users', 'onboarding-data', 'update'] as const,
  },
} as const