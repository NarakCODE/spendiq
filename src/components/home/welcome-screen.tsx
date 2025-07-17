'use client'

import Link from 'next/link'
import { memo } from 'react'

export const WelcomeScreen = memo(function WelcomeScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to SpendIQ
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your advanced expense tracking solution
          </p>
        </div>
        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
})