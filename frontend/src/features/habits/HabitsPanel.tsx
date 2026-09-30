import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { SessionProps } from '../../api/client'
import { getErrorMessage } from '../../shared/format'
import type { Habit } from '../../api/types'

export function HabitsPanel({ token, api, log }: SessionProps) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitForm, setHabitForm] = useState({ title: '', notes: '' })
  const [isLoadingHabits, setIsLoadingHabits] = useState(false)
  const loadHabits = useCallback(async function loadHabits() {
    if (!token) {
      return
    }

    setIsLoadingHabits(true)
    try {
      const nextHabits = await api<Habit[]>('/habits')
      setHabits(nextHabits)
      log(`Loaded ${nextHabits.length} habit${nextHabits.length === 1 ? '' : 's'}.`)
    } catch (error) {
      log(`Loading habits failed: ${getErrorMessage(error)}`)
    } finally {
      setIsLoadingHabits(false)
    }
  }, [api, log, token])
  useEffect(() => { void loadHabits() }, [loadHabits])
  async function handleCreateHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      log('Sign in before creating habits.')
      return
    }

    try {
      await api<Habit>('/habits', {
        method: 'POST',
        body: {
          title: habitForm.title,
          notes: habitForm.notes.trim() || null,
        },
      })
      setHabitForm({ title: '', notes: '' })
      log(`Created habit "${habitForm.title}".`)
      await loadHabits()
    } catch (error) {
      log(`Create habit failed: ${getErrorMessage(error)}`)
    }
  }
  async function handleDeleteHabit(habitId: string) {
    try {
      await api(`/habits/${habitId}`, { method: 'DELETE' })
      setHabits((current) => current.filter((habit) => habit.id !== habitId))
      log(`Deleted habit ${habitId}.`)
    } catch (error) {
      log(`Delete habit failed: ${getErrorMessage(error)}`)
    }
  }
  return (
        <section className="panel">
          <div className="panel-header">
            <h2>Habits</h2>
            <button className="ghost-button" type="button" onClick={() => void loadHabits()} disabled={isLoadingHabits}>
              {isLoadingHabits ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <form className="card form-card inline-form" onSubmit={handleCreateHabit}>
            <label>
              <span>Title</span>
              <input
                value={habitForm.title}
                onChange={(event) => setHabitForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Workout"
                required
              />
            </label>
            <label>
              <span>Notes</span>
              <input
                value={habitForm.notes}
                onChange={(event) => setHabitForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Upper body on Mondays"
              />
            </label>
            <button type="submit">Create habit</button>
          </form>

          <div className="list-grid">
            {!token && <article className="empty-state">Sign in to load habits.</article>}
            {token && habits.length === 0 && <article className="empty-state">No habits yet. Create the first one.</article>}
            {habits.map((habit) => (
              <article key={habit.id} className="card list-card">
                <div className="panel-header">
                  <h3>{habit.title}</h3>
                  <span className={habit.isActive ? 'pill ok' : 'pill'}>{habit.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p>{habit.notes || 'No notes'}</p>
                <div className="meta-row">Created: {new Date(habit.createdAt).toLocaleString()}</div>
                <button className="danger-button" type="button" onClick={() => void handleDeleteHabit(habit.id)}>
                  Delete habit
                </button>
              </article>
            ))}
          </div>
        </section>
  )
}
