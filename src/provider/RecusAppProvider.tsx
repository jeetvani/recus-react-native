import React from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import { RecusContextProvider, RecusUser, useRecus } from '../context/RecusContext'
import RecusNavigator from '../navigation/RecusNavigator'

// ─── Props ───────────────────────────────────────────────────────────────────

type RecusAppProviderProps = {
  sdkKey: string
  user: RecusUser | undefined
  children: React.ReactNode
}

// ─── The modal layer — reads from context ─────────────────────────────────────

function RecusLayer() {
  const { isActive, isComplete } = useRecus()

  // Show modal when:
  // 1. userId exists (isActive)
  // 2. user has not completed onboarding yet (not isComplete)
  const shouldShow = isActive && !isComplete

  return (
    <Modal
      visible={shouldShow}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {
        // Android back button — do nothing
        // Onboarding cannot be dismissed by back press
      }}
    >
      <View style={styles.modalContainer}>
        <RecusNavigator />
      </View>
    </Modal>
  )
}

// ─── Public Provider ──────────────────────────────────────────────────────────

export function RecusAppProvider({
  sdkKey,
  user,
  children,
}: RecusAppProviderProps) {
  return (
    <RecusContextProvider sdkKey={sdkKey} user={user}>
      {/* Their entire app — completely untouched */}
      {children}

      {/* Recus layer — sits above everything */}
      {/* Invisible when not active, full screen when active */}
      <RecusLayer />
    </RecusContextProvider>
  )
}