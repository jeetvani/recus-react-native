import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import RecusWelcomeScreen from '../screens/RecusWelcomeScreen'

// Internal stack — completely isolated navigation tree
// independent={true} means it does not interfere with
// the customer's Expo Router or React Navigation setup

const Stack = createNativeStackNavigator()

export default function RecusNavigator() {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="RecusWelcome"
          component={RecusWelcomeScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}