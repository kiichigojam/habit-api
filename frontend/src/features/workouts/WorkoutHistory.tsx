import { useCallback, useEffect, useState } from 'react'
import type { SessionProps } from '../../api/client'
import { getErrorMessage } from '../../shared/format'
import type { WorkoutDay } from '../../api/types'

export function WorkoutHistory({ token, api, log }: SessionProps) {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutDay[]>([])
  const loadWorkoutHistory = useCallback(async function loadWorkoutHistory() {
    if (!token) {
      return
    }

    try {
      const response = await api<WorkoutDay[]>('/habits/checkins/grouped?days=7')
      setWorkoutHistory(response)
    } catch (error) {
      log(`Loading grouped workout history failed: ${getErrorMessage(error)}`)
    }
  }, [api, log, token])
  useEffect(() => { void loadWorkoutHistory() }, [loadWorkoutHistory])
  return (
        <section className="panel">
          <div className="panel-header">
            <h2>Daily Workout Groups</h2>
            <button className="ghost-button" type="button" onClick={() => void loadWorkoutHistory()}>
              Refresh
            </button>
          </div>
          <div className="list-grid">
            {!token && <article className="empty-state">Sign in to see workouts grouped by day.</article>}
            {token && workoutHistory.length === 0 && (
              <article className="empty-state">No workouts grouped by day yet. Add habit check-ins first.</article>
            )}
            {workoutHistory.map((day) => (
              <article key={day.date} className="card list-card">
                <div className="panel-header">
                  <h3>{day.date}</h3>
                  <span className="pill ok">{day.totalWorkouts} workout{day.totalWorkouts === 1 ? '' : 's'}</span>
                </div>
                <div className="group-list">
                  {day.workouts.map((workout) => (
                    <div key={workout.id} className="group-item">
                      <strong>{workout.habitTitle}</strong>
                      <span>{new Date(workout.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
  )
}
