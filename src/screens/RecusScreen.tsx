import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  TextInput,
  Switch,
} from 'react-native'
import {
  AppOnboardingInputConfig,
  AppOnboardingInputType,
  AppOnboardingScreenConfig,
} from '../api/appOnboarding'
import { RecusEngineActions, RecusUiEngine } from '../components/recus-ui-engine'
import { useRecus } from '../context/RecusContext'
import { useRecusNavigation } from '../navigation/RecusNavigationContext'
import {
  evaluateRecusExpression,
  interpolateRecusTemplate,
} from '../utils/recusExpressions'

// ─── JSON Config Types ────────────────────────────────────────────────────────

export type RecusScreenConfig = AppOnboardingScreenConfig

const BOOLEAN_INPUT_TYPE = 'boolean' as const
const RADIO_INPUT_TYPE = 'radio' as const
const MULTIPLE_SELECTION_MODE = 'multiple' as const
const SINGLE_SELECTION_MODE = 'single' as const
const STRING_TYPE = 'string' as const
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[\d\s().-]{7,}$/
const URL_PATTERN = /^https?:\/\/\S+\.\S+$/

const isString = (value: unknown): value is string => typeof value === STRING_TYPE

const getInputLabel = (input: AppOnboardingInputConfig): string => {
  return input.label.trim() || input.placeholder?.trim() || input.id
}

const getKeyboardType = (inputType: AppOnboardingInputType) => {
  switch (inputType) {
    case 'email':
      return 'email-address'
    case 'number':
      return 'numeric'
    case 'phone':
    case 'tel':
      return 'phone-pad'
    case 'url':
      return 'url'
    default:
      return 'default'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type RecusScreenProps = {
  config: RecusScreenConfig
}

export default function RecusScreen({ config }: RecusScreenProps) {
  const enteredScreenIdRef = useRef<string | null>(null)
  const {
    user,
    markComplete,
    onboardingValues,
    setOnboardingValue,
    submitScreen,
  } = useRecus()
  const { navigate, goBack } = useRecusNavigation()
  const transitions = config.transitions ?? []
  const nextTransition = useMemo(() => {
    return transitions.find(transition => {
      return evaluateRecusExpression(transition.condition, onboardingValues)
    })
  }, [onboardingValues, transitions])
  const inputRules = useMemo(() => {
    return Object.fromEntries(
      (config.inputs ?? []).map(input => [
        input.id,
        { maxLength: input.maxLength },
      ]),
    )
  }, [config.inputs])

  const validateInputs = useCallback((fieldIds?: string[]): boolean => {
    const inputs = fieldIds
      ? (config.inputs ?? []).filter(input => fieldIds.includes(input.id))
      : config.inputs ?? []

    for (const input of inputs) {
      const label = getInputLabel(input)
      const rawValue = onboardingValues[input.id]

      if (input.type === BOOLEAN_INPUT_TYPE) {
        if (input.required && rawValue !== true) {
          Alert.alert('Incomplete Details', `${label} is required.`)
          return false
        }
        continue
      }

      if (input.type === RADIO_INPUT_TYPE) {
        const selectionMode = input.metadata?.selectionMode === 'multiple'
          ? MULTIPLE_SELECTION_MODE
          : SINGLE_SELECTION_MODE
        const hasValue = selectionMode === 'multiple'
          ? Array.isArray(rawValue) && rawValue.length > 0
          : typeof rawValue === 'string' && rawValue.trim().length > 0

        if (input.required && !hasValue) {
          Alert.alert('Incomplete Details', `${label} is required.`)
          return false
        }
        continue
      }

      const value = typeof rawValue === 'string' ? rawValue.trim() : ''

      if (input.required && value.length === 0) {
        Alert.alert('Incomplete Details', `${label} is required.`)
        return false
      }

      if (value.length === 0) continue

      if (input.minLength && value.length < input.minLength) {
        Alert.alert('Incomplete Details', `${label} must be at least ${input.minLength} characters.`)
        return false
      }

      if (input.maxLength && value.length > input.maxLength) {
        Alert.alert('Invalid Details', `${label} must be at most ${input.maxLength} characters.`)
        return false
      }

      if (input.type === 'email' && !EMAIL_PATTERN.test(value)) {
        Alert.alert('Invalid Details', `${label} must be a valid email address.`)
        return false
      }

      if (input.type === 'number' && !Number.isFinite(Number(value))) {
        Alert.alert('Invalid Details', `${label} must be a valid number.`)
        return false
      }

      if ((input.type === 'phone' || input.type === 'tel') && !PHONE_PATTERN.test(value)) {
        Alert.alert('Invalid Details', `${label} must be a valid phone number.`)
        return false
      }

      if (input.type === 'url' && !URL_PATTERN.test(value)) {
        Alert.alert('Invalid Details', `${label} must be a valid URL.`)
        return false
      }

      for (const rule of input.validation?.rules ?? []) {
        if (rule.type === 'min' && Number(value) < Number(rule.value)) {
          Alert.alert('Invalid Details', rule.message ?? `${label} is too small.`)
          return false
        }

        if (rule.type === 'max' && Number(value) > Number(rule.value)) {
          Alert.alert('Invalid Details', rule.message ?? `${label} is too large.`)
          return false
        }

        if (rule.type === 'minLength' && value.length < Number(rule.value)) {
          Alert.alert('Incomplete Details', rule.message ?? `${label} is too short.`)
          return false
        }
      }
    }

    return true
  }, [config.inputs, onboardingValues])

  const runActions = useCallback<RecusEngineActions['runActions']>(
    actions => {
      for (const action of actions) {
        if (action.action === 'navigate' && typeof action.to === 'string') {
          navigate(action.to)
          continue
        }

        if (action.action === 'validate') {
          const fieldIds = Array.isArray(action.fieldIds)
            ? action.fieldIds.filter((fieldId): fieldId is string => typeof fieldId === 'string')
            : undefined
          validateInputs(fieldIds)
          continue
        }

        if (action.action === 'submit') {
          submitScreen(config.id)
          continue
        }

        if (action.action === 'complete') {
          submitScreen(config.id)
          markComplete()
        }
      }
    },
    [config.id, markComplete, navigate, submitScreen, validateInputs],
  )

  useEffect(() => {
    for (const input of config.inputs ?? []) {
      if (onboardingValues[input.id] !== undefined || input.defaultValue === undefined) {
        continue
      }

      const defaultValue = input.defaultValue
      if (
        typeof defaultValue === 'string' ||
        typeof defaultValue === 'boolean' ||
        (Array.isArray(defaultValue) && defaultValue.every(item => typeof item === 'string'))
      ) {
        setOnboardingValue(input.id, defaultValue)
      }
    }
  }, [config.inputs, onboardingValues, setOnboardingValue])

  useEffect(() => {
    const expression = typeof config.conditions?.expression === 'string'
      ? config.conditions.expression
      : undefined
    const elseGoTo = typeof config.conditions?.elseGoTo === 'string'
      ? config.conditions.elseGoTo
      : undefined

    if (expression && elseGoTo && !evaluateRecusExpression(expression, onboardingValues)) {
      navigate(elseGoTo)
      return
    }

    if (enteredScreenIdRef.current === config.id) return
    enteredScreenIdRef.current = config.id

    const onEnter = Array.isArray(config.events?.onEnter)
      ? config.events.onEnter.filter((action): action is Record<string, unknown> => {
        return typeof action === 'object' && action !== null && !Array.isArray(action)
      })
      : []
    if (onEnter.length > 0) runActions(onEnter)
  }, [
    config.conditions,
    config.id,
    config.events,
    navigate,
    onboardingValues,
    runActions,
  ])

  const advanceToNext = useCallback(() => {
    if (nextTransition?.to) {
      navigate(nextTransition.to)
      return
    }

    console.info('Recus onboarding completed', {
      finalScreenId: config.id,
      responses: onboardingValues,
    })
    markComplete()
  }, [config.id, markComplete, navigate, nextTransition?.to, onboardingValues])

  const handleContinue = useCallback(() => {
    if (!validateInputs()) return

    submitScreen(config.id)
    const onSubmit = Array.isArray(config.events?.onSubmit)
      ? config.events.onSubmit.filter((action): action is Record<string, unknown> => {
        return typeof action === 'object' && action !== null && !Array.isArray(action)
      })
      : []
    if (onSubmit.length > 0) runActions(onSubmit)
    advanceToNext()
  }, [advanceToNext, config.events, config.id, runActions, submitScreen, validateInputs])

  const handleSkip = useCallback(() => {
    advanceToNext()
  }, [advanceToNext])

  // Engine actions also carry live input state so freeform input layers can
  // update the same response store used by validation and submission.
  const engineActions = useMemo<RecusEngineActions>(
    () => ({
      onContinue: handleContinue,
      onSkip: handleSkip,
      onBack: goBack,
      values: onboardingValues,
      inputRules,
      onInputChange: setOnboardingValue,
      runActions,
    }),
    [
      goBack,
      handleContinue,
      handleSkip,
      inputRules,
      onboardingValues,
      runActions,
      setOnboardingValue,
    ],
  )

  if (config.ui && typeof config.ui === 'object') {
    return (
      <View style={styles.engineRoot}>
        <RecusUiEngine UI={config.ui} actions={engineActions} />
      </View>
    )
  }

  const resolveText = (text?: string): string | undefined => {
    if (!text) return undefined
    const withUserValues = text.replace(/\{\{user\.(\w+)\}\}/g, (_, key) => {
      return user?.[key] ? String(user[key]) : ''
    })

    return interpolateRecusTemplate(withUserValues, {
      ...onboardingValues,
      user: user ?? {},
    })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {config.title && (
          <Text style={styles.title}>{resolveText(config.title)}</Text>
        )}
        {config.subtitle && (
          <Text style={styles.subtitle}>{resolveText(config.subtitle)}</Text>
        )}
        {config.inputs?.map(input => {
          if (input.type === BOOLEAN_INPUT_TYPE) {
            const boolValue = onboardingValues[input.id]
            return (
              <View key={input.id} style={styles.booleanRow}>
                <View style={styles.booleanLabelContainer}>
                  <Text style={styles.inputLabel}>{input.label}</Text>
                  {input.placeholder ? (
                    <Text style={styles.inputHelp}>{input.placeholder}</Text>
                  ) : null}
                </View>
                <Switch
                  value={typeof boolValue === 'boolean' ? boolValue : false}
                  onValueChange={value => setOnboardingValue(input.id, value)}
                  trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
                  thumbColor={typeof boolValue === 'boolean' && boolValue ? '#2563EB' : '#FFFFFF'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
            )
          }

          if (input.type === RADIO_INPUT_TYPE) {
            const rawValue = onboardingValues[input.id]
            const selectionMode = input.metadata?.selectionMode === MULTIPLE_SELECTION_MODE ? MULTIPLE_SELECTION_MODE : SINGLE_SELECTION_MODE
            const selectedValues: string[] = Array.isArray(rawValue)
              ? rawValue.filter(isString)
              : isString(rawValue)
                ? [rawValue]
                : []

            return (
              <View key={input.id} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{input.label}</Text>
                {(input.options ?? []).map(option => {
                  const selected = selectedValues.includes(option)
                  return (
                    <TouchableOpacity
                      key={option}
                      accessibilityRole={selectionMode === MULTIPLE_SELECTION_MODE ? 'checkbox' : RADIO_INPUT_TYPE}
                      accessibilityState={{ checked: selected }}
                      style={[
                        styles.choice,
                        selected ? styles.choiceSelected : null,
                      ]}
                      onPress={() => {
                        if (selectionMode === MULTIPLE_SELECTION_MODE) {
                          const nextValues = selected
                            ? selectedValues.filter(item => item !== option)
                            : [...selectedValues, option]
                          setOnboardingValue(input.id, nextValues)
                          return
                        }

                        setOnboardingValue(input.id, option)
                      }}
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          selected ? styles.choiceTextSelected : null,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )
          }

          const textValue = onboardingValues[input.id]
          return (
            <View key={input.id} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{input.label}</Text>
              <TextInput
                value={typeof textValue === 'string' ? textValue : ''}
                onChangeText={value => setOnboardingValue(input.id, value)}
                placeholder={input.placeholder}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                secureTextEntry={input.type === 'password'}
                keyboardType={getKeyboardType(input.type)}
                autoCapitalize={
                  input.type === 'email' ||
                  input.type === 'password' ||
                  input.type === 'url'
                    ? 'none'
                    : 'sentences'
                }
                autoCorrect={input.type === 'text' || input.type === 'textarea'}
                maxLength={input.maxLength}
                multiline={input.type === 'textarea'}
              />
            </View>
          )
        })}

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleContinue}>
            <Text style={styles.btnText}>{nextTransition?.to ? 'Continue' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  engineRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14,
  },
  inputLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputHelp: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    width: '100%',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  booleanRow: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  booleanLabelContainer: {
    flex: 1,
    paddingRight: 12,
  },
  choice: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  choiceSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  choiceText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  choiceTextSelected: {
    color: '#FFFFFF',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnPrimary: {
    backgroundColor: '#111827',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
