'use client'

import { useOptionalAuth } from '@/hooks/use-auth'
import { WelcomeScreen } from '@/components/home/welcome-screen'
import { AppHeader } from '@/components/layout/app-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function Home() {
  const { user, isAuthenticated, isLoading } = useOptionalAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <WelcomeScreen />
  }

  // Type guard to ensure user exists when authenticated
  if (!user) {
    return <LoadingSpinner message="Setting up your account..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard Coming Soon
              </h2>
              <p className="text-gray-600">
                Your expense tracking dashboard will be available here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
