import React, { useEffect } from 'react'
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
import { AppOnboardingScreenConfig } from '../api/appOnboarding'
import { useRecus } from '../context/RecusContext'
import { useRecusNavigation } from '../navigation/RecusNavigator'

// ─── JSON Config Types ────────────────────────────────────────────────────────

export type RecusScreenConfig = AppOnboardingScreenConfig

const BOOLEAN_INPUT_TYPE = 'boolean' as const

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
    setCurrentScreenId,
    submitScreen,
  } = useRecus()
  const { navigate, goBack } = useRecusNavigation()
  const transitions = config.transitions ?? []
  const nextTransition = transitions[0]
  const canGoBack = transitions.some(transition => transition.backAllowed)

  useEffect(() => {
    setCurrentScreenId(config.id)
  }, [config.id, setCurrentScreenId])

  const validateInputs = (): boolean => {
    for (const input of config.inputs ?? []) {
      if (input.type === BOOLEAN_INPUT_TYPE) continue

      const rawValue = onboardingValues[input.id]
      const value = typeof rawValue === 'string' ? rawValue.trim() : ''

      if (input.minLength && value.length < input.minLength) {
        Alert.alert('Incomplete Details', `${input.label} must be at least ${input.minLength} characters.`)
        return false
      }

      if (input.maxLength && value.length > input.maxLength) {
        Alert.alert('Invalid Details', `${input.label} must be at most ${input.maxLength} characters.`)
        return false
      }
    }

    return true
  }

  const handleContinue = () => {
    if (!validateInputs()) return

    submitScreen(config.id)

    if (nextTransition?.to) {
      navigate(nextTransition.to)
      return
    }

    console.info('Recus onboarding completed', {
      finalScreenId: config.id,
      responses: onboardingValues,
    })
    markComplete()
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
                autoCapitalize="none"
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
