'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

// Configuration constants for better maintainability
const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes - longer for better caching
  cacheTime: 10 * 60 * 1000, // 10 minutes
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors (client errors)
    if (error?.status >= 400 && error?.status < 500) {
      return false
    }
    // Retry up to 2 times for other errors
    return failureCount < 2
  },
  refetchOnWindowFocus: false, // Prevent excessive refetching
  refetchOnMount: true,
} as const

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: QUERY_CONFIG,
          mutations: {
            retry: 1,
            // Add error handling for mutations
            onError: (error) => {
              console.error('Mutation error:', error)
              // Could integrate with toast notifications here
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}