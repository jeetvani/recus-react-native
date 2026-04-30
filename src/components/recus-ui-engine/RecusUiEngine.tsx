import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { RecusEngineActions, RecusEngineActionsProvider } from './actions'
import { BackgroundRenderer } from './backgrounds'
import { RecusEngineButton, RecusEngineImage, RecusEngineInput } from './layers'
import { normalizeRecusUi } from './schema'
import { RecusUi, isButtonLayer, isImageLayer, isInputLayer } from './types'

type RecusUiEngineProps = {
  UI: RecusUi
  actions?: RecusEngineActions
}

/**
 * Top-level renderer for a Recus UI schema document.
 *
 * Current responsibilities:
 *  - Validate / normalize the incoming JSON via {@link normalizeRecusUi}.
 *  - Render the configured background (gradient / solid / image).
 *  - Render supported layers on top of the background.
 */
export function RecusUiEngine({ UI, actions }: RecusUiEngineProps) {
  // Parse once per UI reference. The onboarding flow is fetched once and
  // each screen's `ui` is referentially stable, so this memo prevents the
  // entire schema walk from running on every parent re-render (e.g. each
  // keystroke in the host screen). It also stabilises `schema.background`
  // and per-layer `style`/`layout` references, which makes the existing
  // `useMemo`s inside layer renderers actually pay off.
  const schema = useMemo(() => normalizeRecusUi(UI), [UI])

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

  const tree = (
    <BackgroundRenderer background={schema.background} style={styles.fill}>
      <View style={styles.layerRoot} pointerEvents="box-none">
        {schema.layers.map(layer => {
          if (isButtonLayer(layer)) {
            return <RecusEngineButton key={layer.id} layer={layer} />
          }

          if (isImageLayer(layer)) {
            return <RecusEngineImage key={layer.id} layer={layer} />
          }

          if (isInputLayer(layer)) {
            return <RecusEngineInput key={layer.id} layer={layer} />
          }

          return null
        })}
      </View>
    </BackgroundRenderer>
  )

  if (!actions) return tree

  return (
    <RecusEngineActionsProvider value={actions}>
      {tree}
    </RecusEngineActionsProvider>
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
