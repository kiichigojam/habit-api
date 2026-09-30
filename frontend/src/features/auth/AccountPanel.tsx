import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { SessionProps } from '../../api/client'
import { getErrorMessage } from '../../shared/format'
import type { AuthMode, AuthResponse, User } from '../../api/types'

export function AccountPanel({ token, api, log, onToken }: SessionProps & { onToken: (token: string) => void }) {
  const [authMode, setAuthMode] = useState<AuthMode>('idle')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const loadCurrentUser = useCallback(async function loadCurrentUser() {
    if (!token) {
      return
    }

    setIsLoadingUser(true)
    try {
      const user = await api<User>('/users/me')
      setCurrentUser(user)
      log(`Loaded profile for ${user.email}.`)
    } catch (error) {
      log(`Loading current user failed: ${getErrorMessage(error)}`)
    } finally {
      setIsLoadingUser(false)
    }
  }, [api, log, token])
  useEffect(() => { void loadCurrentUser() }, [loadCurrentUser])
  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthMode('signup')

    try {
      const response = await api<AuthResponse>('/auth/signup', {
        method: 'POST',
        auth: false,
        body: signupForm,
      })
      onToken(response.token)
      setSignupForm({ name: '', email: '', password: '' })
      log(`Signed up ${signupForm.email}.`)
    } catch (error) {
      log(`Signup failed: ${getErrorMessage(error)}`)
    } finally {
      setAuthMode('idle')
    }
  }
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthMode('login')

    try {
      const response = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        body: loginForm,
      })
      onToken(response.token)
      setLoginForm({ email: '', password: '' })
      log(`Logged in ${loginForm.email}.`)
    } catch (error) {
      log(`Login failed: ${getErrorMessage(error)}`)
    } finally {
      setAuthMode('idle')
    }
  }
  function handleLogout() { onToken(''); log('Signed out.') }
  return (
        <section className="panel">
          <div className="panel-header">
            <h2>Account</h2>
            <button className="ghost-button" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>

          <div className="form-grid">
            <form className="card form-card" onSubmit={handleSignup}>
              <h3>Create account</h3>
              <label>
                <span>Name</span>
                <input
                  value={signupForm.name}
                  onChange={(event) => setSignupForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Demo User"
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="demo@example.com"
                  required
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  minLength={8}
                  value={signupForm.password}
                  onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </label>
              <button type="submit" disabled={authMode !== 'idle'}>
                {authMode === 'signup' ? 'Signing up...' : 'Sign up'}
              </button>
            </form>

            <form className="card form-card" onSubmit={handleLogin}>
              <h3>Log in</h3>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="demo@example.com"
                  required
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </label>
              <button type="submit" disabled={authMode !== 'idle'}>
                {authMode === 'login' ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          </div>

          <article className="card console-card">
            <div className="panel-header">
              <h3>Current user</h3>
              <button className="ghost-button" type="button" onClick={() => void loadCurrentUser()} disabled={isLoadingUser}>
                {isLoadingUser ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <pre>{currentUser ? JSON.stringify(currentUser, null, 2) : 'Sign in to load profile.'}</pre>
          </article>
        </section>
  )
}
