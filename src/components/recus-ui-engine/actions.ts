import { createContext, useContext } from 'react'
import type { OnboardingInputValue } from '../../context/RecusContext'

/**
 * Reserved layer ids the engine recognises.
 *
 * Any tappable layer rendered by the engine whose `id` matches one of these
 * is wired to the corresponding host-supplied action instead of being a
 * no-op. Hosts (e.g. RecusScreen) provide the actual handlers via
 * {@link RecusEngineActionsProvider}.
 */
export const RECUS_ENGINE_ACTION_IDS = {
  continue: 'continue',
  skip: 'skip',
  back: 'back',
} as const

export type RecusEngineActionId =
  (typeof RECUS_ENGINE_ACTION_IDS)[keyof typeof RECUS_ENGINE_ACTION_IDS]

export type RecusEngineActions = {
  onContinue: () => void
  onSkip: () => void
  onBack: () => void
  values: Record<string, OnboardingInputValue>
  inputRules: Record<string, { maxLength?: number }>
  onInputChange: (inputId: string, value: OnboardingInputValue) => void
}

const noop = () => {}

const DEFAULT_ACTIONS: RecusEngineActions = {
  onContinue: noop,
  onSkip: noop,
  onBack: noop,
  values: {},
  inputRules: {},
  onInputChange: noop,
}

export const RecusEngineActionsContext =
  createContext<RecusEngineActions>(DEFAULT_ACTIONS)

export const RecusEngineActionsProvider = RecusEngineActionsContext.Provider

export function useRecusEngineActions(): RecusEngineActions {
  return useContext(RecusEngineActionsContext)
}

export const isRecusEngineActionId = (
  value: unknown,
): value is RecusEngineActionId => {
  return (
    value === RECUS_ENGINE_ACTION_IDS.continue ||
    value === RECUS_ENGINE_ACTION_IDS.skip ||
    value === RECUS_ENGINE_ACTION_IDS.back
  )
}
