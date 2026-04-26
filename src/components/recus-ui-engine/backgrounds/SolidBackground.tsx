import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { RecusUiSolidBackground } from '../types'

type SolidBackgroundProps = {
  background: RecusUiSolidBackground
  style?: ViewStyle
  children?: React.ReactNode
}

export function SolidBackground({ background, style, children }: SolidBackgroundProps) {
  return (
    <View
      style={[styles.fill, { backgroundColor: background.color }, style]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
})
