import { useCallback, useEffect, useMemo, useState } from 'react'
import { createApiClient } from './api/client'
import type { SessionProps } from './api/client'
import { AccountPanel } from './features/auth/AccountPanel'
import { HabitsPanel } from './features/habits/HabitsPanel'
import { WorkoutHistory } from './features/workouts/WorkoutHistory'
import { useNutrition } from './features/nutrition/useNutrition'
import { NutritionHistory } from './features/nutrition/NutritionHistory'
import { NutritionSearch } from './features/nutrition/NutritionSearch'
import { CalorieLog } from './features/nutrition/CalorieLog'
import { formatNumber, getErrorMessage } from './shared/format'
import './App.css'

const tokenStorageKey = 'habit-api-token'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(tokenStorageKey) ?? '')
  const [activity, setActivity] = useState<string[]>(['Frontend booting...'])
  const onToken = useCallback((nextToken: string) => {
    setToken(nextToken)
    if (nextToken) localStorage.setItem(tokenStorageKey, nextToken)
    else localStorage.removeItem(tokenStorageKey)
  }, [])
  const log = useCallback((message: string) => {
    const stamp = new Date().toLocaleTimeString()
    setActivity(current => [`[${stamp}] ${message}`, ...current].slice(0, 14))
  }, [])
  const api = useMemo(() => createApiClient(token, () => onToken('')), [token, onToken])
  return <Dashboard key={token} token={token} api={api} log={log} onToken={onToken} activity={activity} clearActivity={() => setActivity([])} />
}

function Dashboard(props: SessionProps & { onToken: (token: string) => void; activity: string[]; clearActivity: () => void }) {
  const { token, api, log, onToken, activity, clearActivity } = props
  const nutrition = useNutrition(props)
  const { nutritionDate, dailyCalories } = nutrition
  const [health, setHealth] = useState<'checking' | 'healthy' | 'offline'>('checking')
  useEffect(() => {
    let active = true
    api('/health', { auth: false }).then(() => {
      if (active) { setHealth('healthy'); log('Health check passed.') }
    }).catch(error => {
      if (active) { setHealth('offline'); log(`Health check failed: ${getErrorMessage(error)}`) }
    })
    return () => { active = false }
  }, [api, log])
  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Habit API Frontend</p>
          <h1>React frontend for habits and calorie tracking.</h1>
          <p className="lede">
            Search USDA foods, log servings to a specific day, and keep a running calorie total without leaving the app.
          </p>
        </div>

        <div className="hero-metrics">
          <article className="metric-card">
            <span>API</span>
            <strong className={health === 'healthy' ? 'ok' : health === 'offline' ? 'danger' : ''}>
              {health === 'checking' ? 'Checking...' : health === 'healthy' ? 'Healthy' : 'Offline'}
            </strong>
          </article>
          <article className="metric-card">
            <span>Auth</span>
            <strong className={token ? 'ok' : ''}>{token ? 'Signed in' : 'Signed out'}</strong>
          </article>
          <article className="metric-card">
            <span>Calories for {nutritionDate}</span>
            <strong className="ok">{formatNumber(dailyCalories)}</strong>
          </article>
        </div>
      </header>


      <main className="dashboard">
        <AccountPanel token={token} api={api} log={log} onToken={onToken} />
        <NutritionHistory token={token} nutrition={nutrition} />
        <WorkoutHistory token={token} api={api} log={log} />
        <HabitsPanel token={token} api={api} log={log} />
        <NutritionSearch token={token} nutrition={nutrition} />
        <CalorieLog token={token} nutrition={nutrition} />
        <section className="panel">
          <div className="panel-header">
            <h2>Activity</h2>
            <button className="ghost-button" type="button" onClick={clearActivity}>
              Clear
            </button>
          </div>
          <article className="card console-card">
            <pre>{activity.join('\n') || 'No activity yet.'}</pre>
          </article>
        </section>
      </main>
    </div>
  )
}
