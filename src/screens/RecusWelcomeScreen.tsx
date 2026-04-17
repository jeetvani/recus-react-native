import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { useRecus } from '../context/RecusContext'

export default function RecusWelcomeScreen() {
  const { user, markComplete } = useRecus()

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Logo mark placeholder */}
        <View style={styles.logoWrap}>
          <View style={styles.logoSquare} />
          <View style={styles.logoTopArc} />
          <View style={styles.logoBottomArc} />
        </View>

        <Text style={styles.title}>Welcome to Recus</Text>

        <Text style={styles.subtitle}>
          {user?.name
            ? `Hey ${user.name}, let's get you set up.`
            : "Let's get you set up."}
        </Text>

        <Text style={styles.userId}>
          User ID: {user?.userId}
        </Text>

        {/* Temporary dismiss button — will be replaced by real flow */}
        <TouchableOpacity style={styles.btn} onPress={markComplete}>
          <Text style={styles.btnText}>Continue →</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Recus logo — three shapes
  logoWrap: {
    width: 64,
    height: 64,
    marginBottom: 40,
    position: 'relative',
  },
  logoSquare: {
    position: 'absolute',
    left: 0,
    top: 12,
    width: 28,
    height: 40,
    backgroundColor: '#EA580C',
    borderRadius: 4,
  },
  logoTopArc: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    backgroundColor: '#F59E0B',
    borderRadius: 16,
  },
  logoBottomArc: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    backgroundColor: '#FCD34D',
    borderRadius: 12,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  userId: {
    fontSize: 12,
    color: '#404040',
    fontFamily: 'monospace',
    marginBottom: 48,
  },
  btn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
})