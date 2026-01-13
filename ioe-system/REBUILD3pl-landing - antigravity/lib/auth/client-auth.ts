"use client"

import { useEffect, useState } from 'react'
import { ACCESS_TOKEN_COOKIE } from './edge-token'

export interface User {
  id: string
  email: string
  name?: string
  role: string
  organizationId?: string
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  
  return null
}

/**
 * Check if user is authenticated by checking for auth cookie
 */
export function isAuthenticated(): boolean {
  const token = getCookie(ACCESS_TOKEN_COOKIE)
  return !!token
}

/**
 * Get current user info from /api/me endpoint
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/me')
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * React hook to check authentication status and get user info
 */
export function useAuth() {
  const [isAuth, setIsAuth] = useState<boolean>(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated()
      setIsAuth(authenticated)
      
      if (authenticated) {
        try {
          const userData = await getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Failed to fetch user:', error)
          setIsAuth(false)
        }
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setIsAuth(false)
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  return {
    isAuthenticated: isAuth,
    user,
    loading,
    logout
  }
}

























