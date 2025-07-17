interface LoadingSpinnerProps {
  message?: string
  className?: string
}

export function LoadingSpinner({
  message = "Loading...",
  className = "min-h-screen"
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <div className="text-lg text-gray-600">{message}</div>
      </div>
    </div>
  )
}