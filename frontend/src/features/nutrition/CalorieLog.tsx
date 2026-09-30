import type { NutritionState } from './useNutrition'
import { formatNumber, formatServing } from '../../shared/format'

export function CalorieLog({ token, nutrition }: { token: string; nutrition: NutritionState }) {
  const { nutritionDate, loadNutritionEntries, isLoadingEntries, handleManualEntry, manualEntryForm, setManualEntryForm, entryActionKey, dailyCalories, nutritionEntries, handleDeleteNutritionEntry } = nutrition
  return (
        <section className="panel">
          <div className="panel-header">
            <h2>Calorie Log</h2>
            <button
              className="ghost-button"
              type="button"
              onClick={() => void loadNutritionEntries(nutritionDate)}
              disabled={isLoadingEntries}
            >
              {isLoadingEntries ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <form className="card form-card inline-form" onSubmit={handleManualEntry}>
            <label>
              <span>Food name</span>
              <input
                value={manualEntryForm.foodName}
                onChange={(event) => setManualEntryForm((current) => ({ ...current, foodName: event.target.value }))}
                placeholder="Homemade smoothie"
                required
              />
            </label>
            <label>
              <span>Calories per serving</span>
              <input
                type="number"
                min="1"
                step="1"
                value={manualEntryForm.calories}
                onChange={(event) => setManualEntryForm((current) => ({ ...current, calories: event.target.value }))}
                placeholder="450"
                required
              />
            </label>
            <label>
              <span>Servings</span>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={manualEntryForm.servings}
                onChange={(event) => setManualEntryForm((current) => ({ ...current, servings: event.target.value }))}
                required
              />
            </label>
            <button type="submit" disabled={entryActionKey === 'manual'}>
              {entryActionKey === 'manual' ? (manualEntryForm.id ? 'Saving...' : 'Adding...') : (manualEntryForm.id ? 'Save edit' : 'Add custom calories')}
            </button>
            {manualEntryForm.id && (
              <button
                type="button"
                className="ghost-button"
                onClick={() => setManualEntryForm({ id: '', foodName: '', calories: '', servings: '1' })}
              >
                Cancel edit
              </button>
            )}
          </form>
          <div className="card log-summary">
            <strong>{formatNumber(dailyCalories)} calories</strong>
            <span>{nutritionEntries.length} entr{nutritionEntries.length === 1 ? 'y' : 'ies'} on {nutritionDate}</span>
          </div>
          <div className="list-grid">
            {!token && <article className="empty-state">Sign in before tracking calories.</article>}
            {token && nutritionEntries.length === 0 && (
              <article className="empty-state">No calorie entries yet for this date. Add one from the search results.</article>
            )}
            {nutritionEntries.map((entry) => (
              <article key={entry.id} className="card list-card">
                <div className="panel-header">
                  <h3>{entry.foodName}</h3>
                  <span className="pill ok">{formatNumber(entry.calories)} cal</span>
                </div>
                <div className="meta-row">Brand: {entry.brandName || 'n/a'}</div>
                <div className="meta-row">Servings: {formatNumber(entry.servings)}</div>
                <div className="meta-row">Serving size: {formatServing(entry.servingSize, entry.servingSizeUnit)}</div>
                <div className="meta-row">Logged: {new Date(entry.createdAt).toLocaleString()}</div>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void handleDeleteNutritionEntry(entry.id)}
                  disabled={entryActionKey === entry.id}
                >
                  {entryActionKey === entry.id ? 'Deleting...' : 'Delete entry'}
                </button>
              </article>
            ))}
          </div>
        </section>
  )
}
