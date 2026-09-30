import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { SessionProps } from '../../api/client'
import { getErrorMessage } from '../../shared/format'
import type { NutritionResult, NutritionEntry, NutritionEntriesResponse, NutritionDay, QuantityMode } from '../../api/types'
import { formatNumber, todayIso } from '../../shared/format'
import { resultKey, defaultQuantityMode, defaultQuantityAmount, defaultQuantityAmountForMode, quantityToServings, convertQuantityAmount, formatDraftAmount } from './quantities'

export function useNutrition({ token, api, log }: SessionProps) {
  const today = todayIso()
  const [nutritionResults, setNutritionResults] = useState<NutritionResult[]>([])
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([])
  const [dailyCalories, setDailyCalories] = useState(0)
  const [nutritionHistory, setNutritionHistory] = useState<NutritionDay[]>([])
  const [nutritionQuery, setNutritionQuery] = useState('banana')
  const [nutritionDate, setNutritionDate] = useState(today)
  const [servingsDrafts, setServingsDrafts] = useState<Record<string, string>>({})
  const [quantityModes, setQuantityModes] = useState<Record<string, QuantityMode>>({})
  const [manualEntryForm, setManualEntryForm] = useState({
    id: '',
    foodName: '',
    calories: '',
    servings: '1',
  })
  const [isSearchingNutrition, setIsSearchingNutrition] = useState(false)
  const [isLoadingEntries, setIsLoadingEntries] = useState(false)
  const [entryActionKey, setEntryActionKey] = useState('')


  const loadNutritionEntries = useCallback(async function loadNutritionEntries(date: string) {
    if (!token) {
      return
    }

    setIsLoadingEntries(true)
    try {
      const response = await api<NutritionEntriesResponse>(`/nutrition/entries?date=${encodeURIComponent(date)}`)
      setNutritionEntries(response.entries)
      setDailyCalories(Number(response.totalCalories ?? 0))
    } catch (error) {
      log(`Loading calorie entries failed: ${getErrorMessage(error)}`)
    } finally {
      setIsLoadingEntries(false)
    }
  }, [api, log, token])
  const loadNutritionHistory = useCallback(async function loadNutritionHistory() {
    if (!token) {
      return
    }

    try {
      const response = await api<NutritionDay[]>('/nutrition/entries/grouped?days=7')
      setNutritionHistory(response)
    } catch (error) {
      log(`Loading grouped calorie history failed: ${getErrorMessage(error)}`)
    }
  }, [api, log, token])
  useEffect(() => { void loadNutritionEntries(nutritionDate) }, [loadNutritionEntries, nutritionDate])
  useEffect(() => { void loadNutritionHistory() }, [loadNutritionHistory])
  async function handleNutritionSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      log('Sign in before searching nutrition.')
      return
    }

    if (nutritionQuery.trim().length < 2) {
      log('Nutrition search requires at least 2 characters.')
      return
    }

    setIsSearchingNutrition(true)
    try {
      const results = await api<NutritionResult[]>(
        `/nutrition/search?q=${encodeURIComponent(nutritionQuery.trim())}`,
      )
      setNutritionResults(results)
      setQuantityModes(
        Object.fromEntries(results.map((result) => [resultKey(result), defaultQuantityMode(result)]))
      )
      setServingsDrafts(
        Object.fromEntries(results.map((result) => [resultKey(result), defaultQuantityAmount(result)]))
      )
      log(`Loaded ${results.length} nutrition result${results.length === 1 ? '' : 's'} for "${nutritionQuery}".`)
    } catch (error) {
      log(`Nutrition search failed: ${getErrorMessage(error)}`)
    } finally {
      setIsSearchingNutrition(false)
    }
  }
  async function handleAddNutritionEntry(result: NutritionResult) {
    if (!token) {
      log('Sign in before logging calories.')
      return
    }
    if (result.calories == null) {
      log(`Cannot log ${result.description} because USDA did not return calories.`)
      return
    }

    const key = resultKey(result)
    const mode = quantityModes[key] ?? defaultQuantityMode(result)
    const amount = Number.parseFloat(servingsDrafts[key] ?? defaultQuantityAmount(result))
    if (Number.isNaN(amount) || amount <= 0) {
      log(mode === 'grams' ? 'Grams must be greater than 0.' : 'Servings must be greater than 0.')
      return
    }

    const servings = quantityToServings(result, amount, mode)

    setEntryActionKey(key)
    try {
      await api('/nutrition/entries', {
        method: 'POST',
        body: {
          foodName: result.description,
          brandName: result.brandName,
          fdcId: result.fdcId,
          consumedOn: nutritionDate,
          servings,
          caloriesPerServing: result.calories,
          servingSize: result.servingSize,
          servingSizeUnit: result.servingSizeUnit,
        },
      })
      log(
        mode === 'grams'
          ? `Logged ${amount.toFixed(0)} g of ${result.description}.`
          : `Logged ${servings.toFixed(2)} serving(s) of ${result.description}.`,
      )
      await loadNutritionEntries(nutritionDate)
      await loadNutritionHistory()
    } catch (error) {
      log(`Adding calorie entry failed: ${getErrorMessage(error)}`)
    } finally {
      setEntryActionKey('')
    }
  }
  async function handleManualEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      log('Sign in before logging calories.')
      return
    }

    const calories = Number.parseFloat(manualEntryForm.calories)
    const servings = Number.parseFloat(manualEntryForm.servings)
    if (Number.isNaN(calories) || calories <= 0) {
      log('Manual calorie entry requires calories greater than 0.')
      return
    }
    if (Number.isNaN(servings) || servings <= 0) {
      log('Manual calorie entry requires servings greater than 0.')
      return
    }

    setEntryActionKey('manual')
    try {
      await api(manualEntryForm.id ? `/nutrition/entries/${manualEntryForm.id}` : '/nutrition/entries', {
        method: manualEntryForm.id ? 'PATCH' : 'POST',
        body: {
          foodName: manualEntryForm.foodName.trim(),
          brandName: null,
          fdcId: null,
          consumedOn: nutritionDate,
          servings,
          caloriesPerServing: calories,
          servingSize: null,
          servingSizeUnit: null,
        },
      })
      log(
        `${manualEntryForm.id ? 'Updated' : 'Logged'} custom entry "${manualEntryForm.foodName}" for ${formatNumber(calories * servings)} calories.`,
      )
      setManualEntryForm({ id: '', foodName: '', calories: '', servings: '1' })
      await loadNutritionEntries(nutritionDate)
      await loadNutritionHistory()
    } catch (error) {
      log(`Adding manual calorie entry failed: ${getErrorMessage(error)}`)
    } finally {
      setEntryActionKey('')
    }
  }
  async function handleDeleteNutritionEntry(entryId: string) {
    setEntryActionKey(entryId)
    try {
      await api(`/nutrition/entries/${entryId}`, { method: 'DELETE' })
      log(`Deleted calorie entry ${entryId}.`)
      await loadNutritionEntries(nutritionDate)
      await loadNutritionHistory()
    } catch (error) {
      log(`Deleting calorie entry failed: ${getErrorMessage(error)}`)
    } finally {
      setEntryActionKey('')
    }
  }
  async function handleDeleteNutritionDay(date: string) {
    setEntryActionKey(`day-${date}`)
    try {
      await api(`/nutrition/entries?date=${encodeURIComponent(date)}`, { method: 'DELETE' })
      log(`Deleted calorie entries for ${date}.`)
      await loadNutritionEntries(nutritionDate)
      await loadNutritionHistory()
    } catch (error) {
      log(`Deleting calorie day failed: ${getErrorMessage(error)}`)
    } finally {
      setEntryActionKey('')
    }
  }
  function handleQuantityModeChange(result: NutritionResult, nextMode: QuantityMode) {
    const key = resultKey(result)
    const currentMode = quantityModes[key] ?? defaultQuantityMode(result)
    const currentAmount = Number.parseFloat(servingsDrafts[key] ?? defaultQuantityAmount(result))

    setQuantityModes((current) => ({
      ...current,
      [key]: nextMode,
    }))

    if (Number.isNaN(currentAmount) || currentMode === nextMode) {
      setServingsDrafts((current) => ({
        ...current,
        [key]: defaultQuantityAmountForMode(nextMode),
      }))
      return
    }

    const nextAmount = convertQuantityAmount(result, currentAmount, currentMode, nextMode)
    setServingsDrafts((current) => ({
      ...current,
      [key]: formatDraftAmount(nextAmount, nextMode),
    }))
  }
  function loadEntryIntoEditor(entry: NutritionEntry) {
    setNutritionDate(entry.consumedOn)
    setManualEntryForm({
      id: entry.id,
      foodName: entry.foodName,
      calories: `${entry.servings ? entry.calories / entry.servings : entry.calories}`,
      servings: `${entry.servings}`,
    })
    log(`Loaded ${entry.foodName} into the calorie editor.`)
  }
  return { nutritionResults, nutritionEntries, dailyCalories, nutritionHistory, nutritionQuery, setNutritionQuery, nutritionDate, setNutritionDate, servingsDrafts, setServingsDrafts, quantityModes, manualEntryForm, setManualEntryForm, isSearchingNutrition, isLoadingEntries, entryActionKey, loadNutritionEntries, loadNutritionHistory, handleNutritionSearch, handleAddNutritionEntry, handleManualEntry, handleDeleteNutritionEntry, handleDeleteNutritionDay, handleQuantityModeChange, loadEntryIntoEditor }
}

export type NutritionState = ReturnType<typeof useNutrition>
