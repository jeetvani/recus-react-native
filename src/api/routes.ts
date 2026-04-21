const API_PREFIX = '/api'
const APP_SDK_PREFIX = `${API_PREFIX}/app-sdk`

export const apiRoutes = {
  appSdk: {
    authenticate: () => `${APP_SDK_PREFIX}/authenticate`,
    onboarding: () => `${APP_SDK_PREFIX}/onboarding`,
    appUsers: () => `${APP_SDK_PREFIX}/app-users`,
    appUserOnboardingData: (appUserId: string) =>
      `${APP_SDK_PREFIX}/app-users/${encodeURIComponent(appUserId)}/onboarding-data`,
  },
} as const
