import React, { memo, useMemo } from 'react'
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import { useRecusEngineActions } from '../actions'
import {
  RecusUiInputLayer,
  RecusUiInputType,
  RecusUiLayerDimension,
} from '../types'

type RecusEngineInputProps = {
  layer: RecusUiInputLayer
}

const toStyleDimension = (
  dimension: RecusUiLayerDimension,
): ViewStyle['width'] | ViewStyle['height'] | undefined => {
  if (dimension === 'fill') return '100%'
  if (dimension === 'hug') return undefined
  return dimension
}

const toKeyboardType = (inputType: RecusUiInputType): KeyboardTypeOptions => {
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

function RecusEngineInputImpl({ layer }: RecusEngineInputProps) {
  const { layout, style } = layer
  const { values, inputRules, onInputChange } = useRecusEngineActions()
  const currentValue = values[layer.fieldId]
  const value = typeof currentValue === 'string' ? currentValue : ''
  const trimmedLabel = layer.label?.trim()

  const containerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    return [
      layout.position === 'freeform' ? styles.freeform : null,
      {
        left: layout.position === 'freeform' ? layout.x : undefined,
        top: layout.position === 'freeform' ? layout.y : undefined,
        width: toStyleDimension(layout.width),
        height: toStyleDimension(layout.height),
        zIndex: layout.zIndex,
      },
    ]
  }, [layout])

  const inputStyle = useMemo<StyleProp<TextStyle>>(() => {
    return {
      color: style.textColor,
      fontSize: style.fontSize,
      borderColor: style.borderColor,
      borderWidth: style.borderWidth,
      borderRadius: style.borderRadius,
      backgroundColor: style.backgroundColor,
    }
  }, [style])

  const labelStyle = useMemo<StyleProp<TextStyle>>(() => {
    return {
      color: style.labelColor,
      fontSize: style.labelSize,
    }
  }, [style])

  return (
    <View style={containerStyle} pointerEvents="box-none">
      {trimmedLabel ? (
        <Text numberOfLines={1} style={[styles.label, labelStyle]}>
          {trimmedLabel}
          {layer.required ? ' *' : ''}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={nextValue => onInputChange(layer.fieldId, nextValue)}
        placeholder={layer.placeholder}
        placeholderTextColor={style.placeholderColor}
        style={[styles.input, inputStyle]}
        secureTextEntry={layer.inputType === 'password'}
        keyboardType={toKeyboardType(layer.inputType)}
        autoCapitalize={
          layer.inputType === 'email' ||
          layer.inputType === 'password' ||
          layer.inputType === 'url'
            ? 'none'
            : 'sentences'
        }
        autoCorrect={layer.inputType === 'text'}
        maxLength={inputRules[layer.fieldId]?.maxLength}
      />
    </View>
  )
}

export const RecusEngineInput = memo(RecusEngineInputImpl)

const styles = StyleSheet.create({
  freeform: {
    position: 'absolute',
  },
  label: {
    marginBottom: 4,
  },
  input: {
    flex: 1,
    minHeight: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
})
