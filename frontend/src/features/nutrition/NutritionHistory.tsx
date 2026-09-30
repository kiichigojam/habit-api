import type { NutritionState } from './useNutrition'
import { formatNumber } from '../../shared/format'

export function NutritionHistory({ token, nutrition }: { token: string; nutrition: NutritionState }) {
  const { nutritionHistory, loadNutritionHistory, handleDeleteNutritionDay, entryActionKey, loadEntryIntoEditor } = nutrition
  return (
        <section className="panel">
          <div className="panel-header">
            <h2>Daily Nutrition Groups</h2>
            <button className="ghost-button" type="button" onClick={() => void loadNutritionHistory()}>
              Refresh
            </button>
          </div>
          <div className="list-grid">
            {!token && <article className="empty-state">Sign in to see nutrition grouped by day.</article>}
            {token && nutritionHistory.length === 0 && (
              <article className="empty-state">No grouped calorie history yet.</article>
            )}
            {nutritionHistory.map((day) => (
              <article key={day.consumedOn} className="card list-card">
                <div className="panel-header">
                  <h3>{day.consumedOn}</h3>
                  <span className="pill ok">{formatNumber(day.totalCalories)} cal</span>
                </div>
                <div className="meta-row">{day.entries.length} entr{day.entries.length === 1 ? 'y' : 'ies'}</div>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void handleDeleteNutritionDay(day.consumedOn)}
                  disabled={entryActionKey === `day-${day.consumedOn}`}
                >
                  {entryActionKey === `day-${day.consumedOn}` ? 'Deleting day...' : 'Delete day'}
                </button>
                <div className="group-list">
                  {day.entries.map((entry) => (
                    <div key={entry.id} className="group-item">
                      <strong>{entry.foodName}</strong>
                      <div className="group-actions">
                        <span>{formatNumber(entry.calories)} cal</span>
                        <button className="ghost-button" type="button" onClick={() => loadEntryIntoEditor(entry)}>
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
  )
}
