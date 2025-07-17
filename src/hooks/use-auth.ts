'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

interface User {
  id: string
  email: string
  name?: string | null
  createdAt: string
  updatedAt: string
}

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
}

interface UseOptionalAuthReturn extends UseAuthReturn {
  // Same interface for consistency
}

// Query key factory for auth-related queries
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
}

/**
 * Hook for components that require authentication
 * Will redirect to sign-in if not authenticated
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession({
    required: true,
  })

  const {
    data: user,
    isLoading: isUserLoading,
    error,
  } = useQuery({
    queryKey: authKeys.profile(),
    queryFn: async (): Promise<User> => {
      const response = await fetch('/api/user/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }
      const data = await response.json()
      return data.user
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    user: user || null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading' || isUserLoading,
    error: error as Error | null,
  }
}

/**
 * Hook for components that work with or without authentication
 * Will not redirect if not authenticated
 */
export function useOptionalAuth(): UseOptionalAuthReturn {
  const { data: session, status } = useSession()

  const {
    data: user,
    isLoading: isUserLoading,
    error,
  } = useQuery({
    queryKey: authKeys.profile(),
    queryFn: async (): Promise<User> => {
      const response = await fetch('/api/user/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch user profile')
      }
      const data = await response.json()
      return data.user
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    user: user || null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading' || (!!session?.user && isUserLoading),
    error: error as Error | null,
  }
}