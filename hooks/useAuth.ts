'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { data: session, status } = useSession()
  const { user, setUser, logout: logoutStore, isLoading, setLoading } = useAuthStore()

  const isPending = status === 'loading'

  // Sync session with store
  useEffect(() => {
    if (isPending) {
      setLoading(true)
      return
    }

    if (session?.user) {
      setUser({
        id: session.user.id as string,
        email: session.user.email as string,
        name: session.user.name || null,
        image: session.user.image || null,
      })
      setLoading(false)
    } else if (!session && !isPending) {
      setUser(null)
      setLoading(false)
    }
  }, [session, isPending, setUser, setLoading])

  const logout = async () => {
    // Clear auth store
    logoutStore()

    // Clear persisted auth data from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('xenith-auth-storage')
    }

    // Sign out and let NextAuth handle the redirect
    await signOut({ callbackUrl: '/login' })
  }

  return {
    user: session?.user || user,
    isAuthenticated: !!session?.user,
    isLoading: isPending || isLoading,
    logout,
  }
}
