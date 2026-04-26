import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { BackgroundRenderer } from './backgrounds'
import { RecusEngineButton } from './layers'
import { normalizeRecusUi } from './schema'
import { RecusUi, isButtonLayer } from './types'

type RecusUiEngineProps = {
  UI: RecusUi
}

/**
 * Top-level renderer for a Recus UI schema document.
 *
 * Current responsibilities:
 *  - Validate / normalize the incoming JSON via {@link normalizeRecusUi}.
 *  - Render the configured background (gradient / solid / image).
 *  - Render supported layers on top of the background.
 */
export function RecusUiEngine({ UI }: RecusUiEngineProps) {
  const schema = normalizeRecusUi(UI)

  if (!schema) {
    return (
      <View style={styles.invalid}>
        <Text style={styles.invalidTitle}>Recus UI Engine</Text>
        <Text style={styles.invalidBody}>
          Invalid or unsupported UI schema received.
        </Text>
      </View>
    )
  }

  return (
    <BackgroundRenderer background={schema.background} style={styles.fill}>
      <View style={styles.layerRoot} pointerEvents="box-none">
        {schema.layers.map(layer => {
          if (isButtonLayer(layer)) {
            return <RecusEngineButton key={layer.id} layer={layer} />
          }

          return null
        })}
      </View>
    </BackgroundRenderer>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  layerRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  invalid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
  },
  invalidTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 6,
  },
  invalidBody: {
    fontSize: 13,
    color: '#7F1D1D',
    textAlign: 'center',
  },
})
