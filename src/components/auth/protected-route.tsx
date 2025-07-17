'use client'

import { useAuth } from '@/hooks/use-auth'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function ProtectedRoute({
  children,
  fallback = <div className="flex items-center justify-center min-h-screen">Loading...</div>
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <>{fallback}</>
  }

  if (!isAuthenticated) {
    return null // useAuth hook will redirect to signin
  }

  return <>{children}</>
}