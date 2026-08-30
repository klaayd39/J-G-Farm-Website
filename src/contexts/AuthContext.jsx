import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) {
        setProfile(data)
      }
    } catch {
      // Profile fetch failed — user session may still be valid
    }
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active) return
      if (error) {
        console.error('Session error:', error.message)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

      const currentUser = session?.user ?? null
      setUser(currentUser)

      // Defer Supabase calls — avoids JWT lockups inside this callback
      setTimeout(() => {
        if (!active) return
        if (currentUser) {
          fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }, 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
