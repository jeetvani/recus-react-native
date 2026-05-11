type RecusExpressionValue = unknown
type RecusExpressionValues = Record<string, RecusExpressionValue>

const TEMPLATE_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g
const COMPARISON_OPERATORS = ['>=', '<=', '==', '!=', '>', '<'] as const

const splitOutsideQuotes = (expression: string, operator: string): string[] => {
  const parts: string[] = []
  let start = 0
  let quote: string | null = null

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index]
    if ((char === '"' || char === "'") && expression[index - 1] !== '\\') {
      quote = quote === char ? null : quote ?? char
      continue
    }

    if (!quote && expression.startsWith(operator, index)) {
      parts.push(expression.slice(start, index))
      start = index + operator.length
      index += operator.length - 1
    }
  }

  parts.push(expression.slice(start))
  return parts
}

const stripTemplateBraces = (operand: string): string => {
  const trimmed = operand.trim()
  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    return trimmed.slice(2, -2).trim()
  }
  return trimmed
}

const getValue = (
  values: RecusExpressionValues,
  key: string,
): RecusExpressionValue => values[key]

export const resolveRecusExpressionPath = (
  path: string,
  values: RecusExpressionValues,
): RecusExpressionValue => {
  const expression = stripTemplateBraces(path)

  const joinMatch = expression.match(/^([A-Za-z0-9_-]+)\.join\((['"])(.*?)\2\)$/)
  if (joinMatch) {
    const value = getValue(values, joinMatch[1])
    return Array.isArray(value) ? value.join(joinMatch[3]) : ''
  }

  const includesMatch = expression.match(/^([A-Za-z0-9_-]+)\.includes\((['"])(.*?)\2\)$/)
  if (includesMatch) {
    const value = getValue(values, includesMatch[1])
    return Array.isArray(value) ? value.includes(includesMatch[3]) : false
  }

  const lengthMatch = expression.match(/^([A-Za-z0-9_-]+)\.length$/)
  if (lengthMatch) {
    const value = getValue(values, lengthMatch[1])
    if (typeof value === 'string' || Array.isArray(value)) return value.length
    return 0
  }

  return getValue(values, expression)
}

const parseOperand = (
  operand: string,
  values: RecusExpressionValues,
): RecusExpressionValue => {
  const trimmed = operand.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    return resolveRecusExpressionPath(trimmed, values)
  }

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).replace(/\\(['"])/g, '$1')
  }

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed)

  return resolveRecusExpressionPath(trimmed, values)
}

const isTruthy = (value: RecusExpressionValue): boolean => {
  if (Array.isArray(value)) return value.length > 0
  return !!value
}

const compareValues = (
  left: RecusExpressionValue,
  operator: (typeof COMPARISON_OPERATORS)[number],
  right: RecusExpressionValue,
): boolean => {
  if (operator === '==' || operator === '!=') {
    const equal = Array.isArray(left) || Array.isArray(right)
      ? JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
      : String(left ?? '') === String(right ?? '')
    return operator === '==' ? equal : !equal
  }

  const leftNumber = typeof left === 'number' ? left : Number(left)
  const rightNumber = typeof right === 'number' ? right : Number(right)

  if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) {
    return false
  }

  switch (operator) {
    case '>':
      return leftNumber > rightNumber
    case '>=':
      return leftNumber >= rightNumber
    case '<':
      return leftNumber < rightNumber
    case '<=':
      return leftNumber <= rightNumber
    default:
      return false
  }
}

const findComparisonOperator = (
  expression: string,
): { operator: (typeof COMPARISON_OPERATORS)[number]; index: number } | null => {
  let quote: string | null = null

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index]
    if ((char === '"' || char === "'") && expression[index - 1] !== '\\') {
      quote = quote === char ? null : quote ?? char
      continue
    }

    if (quote) continue

    for (const operator of COMPARISON_OPERATORS) {
      if (expression.startsWith(operator, index)) {
        return { operator, index }
      }
    }
  }

  return null
}

export const evaluateRecusExpression = (
  expression: string | null | undefined,
  values: RecusExpressionValues,
): boolean => {
  if (expression === null || expression === undefined || expression.trim() === '') {
    return true
  }

  const trimmed = expression.trim()
  const orParts = splitOutsideQuotes(trimmed, '||')
  if (orParts.length > 1) {
    return orParts.some(part => evaluateRecusExpression(part, values))
  }

  const andParts = splitOutsideQuotes(trimmed, '&&')
  if (andParts.length > 1) {
    return andParts.every(part => evaluateRecusExpression(part, values))
  }

  if (trimmed.startsWith('!')) {
    return !evaluateRecusExpression(trimmed.slice(1), values)
  }

  const comparison = findComparisonOperator(trimmed)
  if (comparison) {
    const left = parseOperand(trimmed.slice(0, comparison.index), values)
    const right = parseOperand(
      trimmed.slice(comparison.index + comparison.operator.length),
      values,
    )
    return compareValues(left, comparison.operator, right)
  }

  return isTruthy(parseOperand(trimmed, values))
}

export const interpolateRecusTemplate = (
  template: string,
  values: RecusExpressionValues,
): string => {
  return template.replace(TEMPLATE_PATTERN, (_match, path: string) => {
    const value = resolveRecusExpressionPath(path, values)
    if (value === null || value === undefined) return ''
    if (Array.isArray(value)) return value.join(', ')
    return String(value)
  })
}
