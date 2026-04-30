import React, { useCallback, useMemo } from 'react'
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
import { useRecusNavigation } from '../navigation/RecusNavigator'

// ─── JSON Config Types ────────────────────────────────────────────────────────

export type RecusScreenConfig = AppOnboardingScreenConfig

const BOOLEAN_INPUT_TYPE = 'boolean' as const
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[\d\s().-]{7,}$/
const URL_PATTERN = /^https?:\/\/\S+\.\S+$/

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
  const {
    user,
    markComplete,
    onboardingValues,
    setOnboardingValue,
    submitScreen,
  } = useRecus()
  const { navigate, goBack } = useRecusNavigation()
  const transitions = config.transitions ?? []
  const nextTransition = transitions[0]
  const canGoBack = transitions.some(transition => transition.backAllowed)
  const inputRules = useMemo(() => {
    return Object.fromEntries(
      (config.inputs ?? []).map(input => [
        input.id,
        { maxLength: input.maxLength },
      ]),
    )
  }, [config.inputs])

  const validateInputs = useCallback((): boolean => {
    for (const input of config.inputs ?? []) {
      const label = getInputLabel(input)

      if (input.type === BOOLEAN_INPUT_TYPE) {
        if (input.required && onboardingValues[input.id] !== true) {
          Alert.alert('Incomplete Details', `${label} is required.`)
          return false
        }
        continue
      }

      const rawValue = onboardingValues[input.id]
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

      if (input.type === 'phone' && !PHONE_PATTERN.test(value)) {
        Alert.alert('Invalid Details', `${label} must be a valid phone number.`)
        return false
      }

      if (input.type === 'url' && !URL_PATTERN.test(value)) {
        Alert.alert('Invalid Details', `${label} must be a valid URL.`)
        return false
      }
    }

    return true
  }, [config.inputs, onboardingValues])

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
    advanceToNext()
  }, [advanceToNext, config.id, submitScreen, validateInputs])

  const handleSkip = useCallback(() => {
    advanceToNext()
  }, [advanceToNext])

  // Engine actions also carry live input state so freeform input layers can
  // update the same response store used by validation and submission.
  const engineActions = useMemo<RecusEngineActions>(
    () => ({
      onContinue: handleContinue,
      onSkip: handleSkip,
      values: onboardingValues,
      inputRules,
      onInputChange: setOnboardingValue,
    }),
    [handleContinue, handleSkip, inputRules, onboardingValues, setOnboardingValue],
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
    return text.replace(/\{\{user\.(\w+)\}\}/g, (_, key) => {
      return user?.[key] ? String(user[key]) : ''
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
                autoCorrect={input.type === 'text'}
                maxLength={input.maxLength}
              />
            </View>
          )
        })}

        <View style={styles.actions}>
          {canGoBack ? (
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={goBack}>
              <Text style={[styles.btnText, styles.btnTextSecondary]}>Back</Text>
            </TouchableOpacity>
          ) : null}

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
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnTextSecondary: {
    color: '#111827',
  },
})
