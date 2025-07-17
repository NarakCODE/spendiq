'use client'

import { signOut } from 'next-auth/react'
import { User } from 'next-auth'
import { memo, useCallback } from 'react'

interface AppHeaderProps {
  user: User
}

export const AppHeader = memo(function AppHeader({ user }: AppHeaderProps) {
  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: '/' })
  }, [])

  return (
    <nav className="bg-white shadow" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">SpendIQ</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700" aria-label="Current user">
              Welcome, {user.name || user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Sign out of your account"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
})