import type { NutritionState } from './useNutrition'
import type { QuantityMode } from '../../api/types'
import { formatNumber, formatServing } from '../../shared/format'
import { resultKey, defaultQuantityMode, defaultQuantityAmount, quantityToServings, canUseGramMode, getGramsPerServing } from './quantities'

export function NutritionSearch({ token, nutrition }: { token: string; nutrition: NutritionState }) {
  const { nutritionDate, setNutritionDate, nutritionQuery, setNutritionQuery, handleNutritionSearch, isSearchingNutrition, nutritionResults, quantityModes, servingsDrafts, entryActionKey, handleQuantityModeChange, setServingsDrafts, handleAddNutritionEntry } = nutrition
  return (
        <section className="panel">
          <div className="panel-header">
            <h2>Nutrition Search</h2>
            <label className="date-control">
              <span>Tracking date</span>
              <input type="date" value={nutritionDate} onChange={(event) => setNutritionDate(event.target.value)} />
            </label>
          </div>

          <form className="card form-card inline-form nutrition-form" onSubmit={handleNutritionSearch}>
            <label className="wide">
              <span>Food query</span>
              <input
                value={nutritionQuery}
                onChange={(event) => setNutritionQuery(event.target.value)}
                placeholder="banana"
                minLength={2}
                required
              />
            </label>
            <button type="submit" disabled={isSearchingNutrition}>
              {isSearchingNutrition ? 'Searching...' : 'Find calories'}
            </button>
          </form>

          <div className="list-grid">
            {!token && <article className="empty-state">Sign in before searching nutrition.</article>}
            {token && nutritionResults.length === 0 && (
              <article className="empty-state">Run a food search to see calories, serving size, and USDA IDs.</article>
            )}
            {nutritionResults.map((result) => {
              const key = resultKey(result)
              const mode = quantityModes[key] ?? defaultQuantityMode(result)
              const amount = servingsDrafts[key] ?? defaultQuantityAmount(result)
              const disabled = result.calories == null || entryActionKey === key
              const amountValue = Number.parseFloat(amount) || 0
              const projectedCalories = result.calories == null
                ? null
                : result.calories * quantityToServings(result, amountValue, mode)
              const supportsGramMode = canUseGramMode(result)
              const gramsPerServing = getGramsPerServing(result)

              return (
                <article key={key} className="card list-card">
                  <div className="panel-header">
                    <h3>{result.description}</h3>
                    <span className="pill">{result.dataType || 'Unknown'}</span>
                  </div>
                  <div className="meta-row">Brand: {result.brandName || 'n/a'}</div>
                  <div className="meta-row">
                    Calories {result.caloriesBasis === 'per_100g' ? 'per 100 g' : 'per serving'}: {formatNumber(result.calories)}
                  </div>
                  <div className="meta-row">Serving: {formatServing(result.servingSize, result.servingSizeUnit, result.dataType)}</div>
                  <div className="meta-row">FDC ID: {result.fdcId ?? 'n/a'}</div>
                  {supportsGramMode && (
                    <div className="meta-row">1 serving = {formatServing(gramsPerServing, 'g')}</div>
                  )}
                  {result.caloriesBasis === 'per_100g' && (
                    <div className="meta-row">USDA did not provide a serving size, so this result is handled as grams.</div>
                  )}
                  <div className="entry-controls">
                    {supportsGramMode && (
                      <label>
                        <span>Input mode</span>
                        <select
                          value={mode}
                          onChange={(event) => handleQuantityModeChange(result, event.target.value as QuantityMode)}
                        >
                          <option value="servings">Servings</option>
                          <option value="grams">Grams</option>
                        </select>
                      </label>
                    )}
                    <label>
                      <span>{mode === 'grams' ? 'Grams' : 'Servings'}</span>
                      <input
                        type="number"
                        min={mode === 'grams' ? '1' : '0.25'}
                        step={mode === 'grams' ? '1' : '0.25'}
                        value={amount}
                        onChange={(event) =>
                          setServingsDrafts((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="meta-row">Entry calories: {formatNumber(projectedCalories)}</div>
                    <button type="button" disabled={disabled} onClick={() => void handleAddNutritionEntry(result)}>
                      {entryActionKey === key ? 'Adding...' : 'Add to log'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
  )
}
