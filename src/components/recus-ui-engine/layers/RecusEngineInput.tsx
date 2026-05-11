import React, { memo, useMemo } from 'react'
import {
  Animated,
  KeyboardTypeOptions,
  Pressable,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import { useRecusEngineActions } from '../actions'
import { useRecusLayerAnimation } from '../animation'
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
    case 'tel':
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
  const animationStyle = useRecusLayerAnimation(layer.animation)

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

  const renderInput = () => {
    if (layer.inputType === 'boolean') {
      return (
        <View style={[styles.booleanRow, inputStyle]}>
          <Text style={[styles.booleanText, labelStyle]}>{layer.placeholder}</Text>
          <Switch
            value={currentValue === true}
            onValueChange={nextValue => onInputChange(layer.fieldId, nextValue)}
          />
        </View>
      )
    }

    if (layer.inputType === 'radio') {
      const selectedValues = Array.isArray(currentValue)
        ? currentValue
        : typeof currentValue === 'string'
          ? [currentValue]
          : layer.selectedValues ?? []
      const selectionMode = layer.selectionMode ?? 'single'

      return (
        <View style={[styles.radioGroup, inputStyle]}>
          {(layer.options ?? []).map(option => {
            const selected = selectedValues.includes(option.value)
            const palette = selected
              ? style.optionStyle?.selected
              : style.optionStyle?.unselected

            return (
              <Pressable
                key={option.id}
                accessibilityRole={selectionMode === 'multiple' ? 'checkbox' : 'radio'}
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  if (selectionMode === 'multiple') {
                    const nextValues = selected
                      ? selectedValues.filter(item => item !== option.value)
                      : [...selectedValues, option.value]
                    onInputChange(layer.fieldId, nextValues)
                    return
                  }

                  onInputChange(layer.fieldId, option.value)
                }}
                style={[
                  styles.radioOption,
                  {
                    backgroundColor: palette?.backgroundColor ?? style.backgroundColor,
                    borderColor: palette?.borderColor ?? style.borderColor,
                    borderWidth: style.optionStyle?.borderWidth ?? style.borderWidth,
                    borderRadius: style.optionStyle?.borderRadius ?? style.borderRadius,
                    marginBottom: style.optionStyle?.gap ?? 8,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.radioOptionText,
                    {
                      color: palette?.textColor ?? style.textColor,
                      fontSize: style.fontSize,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )
    }

    return (
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
        autoCorrect={layer.inputType === 'text' || layer.inputType === 'textarea'}
        maxLength={inputRules[layer.fieldId]?.maxLength ?? layer.maxLength}
        multiline={layer.inputType === 'textarea'}
      />
    )
  }

  return (
    <Animated.View style={[containerStyle, animationStyle]} pointerEvents="box-none">
      {trimmedLabel ? (
        <Text numberOfLines={1} style={[styles.label, labelStyle]}>
          {trimmedLabel}
          {layer.required ? ' *' : ''}
        </Text>
      ) : null}
      {renderInput()}
    </Animated.View>
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
  booleanRow: {
    flex: 1,
    minHeight: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  booleanText: {
    flex: 1,
    paddingRight: 12,
  },
  radioGroup: {
    flex: 1,
    minHeight: 1,
    padding: 10,
  },
  radioOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  radioOptionText: {
    fontWeight: '600',
  },
})
