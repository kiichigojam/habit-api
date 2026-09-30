import type { NutritionResult, QuantityMode } from '../../api/types'

export function resultKey(result: NutritionResult) {
  return `${result.fdcId ?? 'na'}-${result.description}`
}

export function defaultQuantityMode(result: NutritionResult): QuantityMode {
  return result.caloriesBasis === 'per_100g' ? 'grams' : 'servings'
}

export function defaultQuantityAmount(result: NutritionResult) {
  return defaultQuantityMode(result) === 'grams' ? '100' : '1'
}

export function defaultQuantityAmountForMode(mode: QuantityMode) {
  return mode === 'grams' ? '100' : '1'
}

export function canUseGramMode(result: NutritionResult) {
  return result.caloriesBasis === 'per_100g' || getGramsPerServing(result) != null
}

export function getGramsPerServing(result: NutritionResult) {
  if (result.caloriesBasis === 'per_100g') {
    return 100
  }
  return result.servingSize != null && result.servingSizeUnit?.toLowerCase() === 'g'
    ? result.servingSize
    : null
}

export function quantityToServings(result: NutritionResult, amount: number, mode: QuantityMode) {
  if (mode === 'grams') {
    if (result.caloriesBasis === 'per_100g') {
      return amount / 100
    }
    const gramsPerServing = getGramsPerServing(result)
    return gramsPerServing ? amount / gramsPerServing : amount
  }
  return amount
}

export function convertQuantityAmount(
  result: NutritionResult,
  amount: number,
  currentMode: QuantityMode,
  nextMode: QuantityMode,
) {
  if (currentMode === nextMode) {
    return amount
  }

  if (currentMode === 'servings' && nextMode === 'grams') {
    if (result.caloriesBasis === 'per_100g') {
      return amount * 100
    }
    const gramsPerServing = getGramsPerServing(result)
    return gramsPerServing ? amount * gramsPerServing : amount
  }

  if (currentMode === 'grams' && nextMode === 'servings') {
    if (result.caloriesBasis === 'per_100g') {
      return amount / 100
    }
    const gramsPerServing = getGramsPerServing(result)
    return gramsPerServing ? amount / gramsPerServing : amount
  }

  return amount
}

export function formatDraftAmount(amount: number, mode: QuantityMode) {
  if (mode === 'grams') {
    return `${Math.round(amount)}`
  }
  return amount.toFixed(2).replace(/\.00$/, '').replace(/(\.\d*[1-9])0$/, '$1')
}
