'use client'

import { useSession } from 'next-auth/react'

interface AuthStatusProps {
  className?: string;
  showEmail?: boolean;
}

interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  success: 'bg-green-100 border-green-400 text-green-700',
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  error: 'bg-red-100 border-red-400 text-red-700',
  info: 'bg-blue-100 border-blue-400 text-blue-700'
};

function StatusBadge({ variant, children, className = '' }: StatusBadgeProps) {
  return (
    <div className={`border px-4 py-3 rounded ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

const LoadingStatus = () => (
  <StatusBadge variant="info" className="animate-pulse">
    <span role="status" aria-live="polite">
      Loading authentication status...
    </span>
  </StatusBadge>
);

const AuthenticatedStatus = ({ email }: { email: string }) => (
  <StatusBadge variant="success">
    <strong>Authenticated:</strong> {email}
  </StatusBadge>
);

const UnauthenticatedStatus = () => (
  <StatusBadge variant="warning">
    <strong>Not authenticated</strong>
  </StatusBadge>
);

const ErrorStatus = () => (
  <StatusBadge variant="error">
    <strong>Authentication Error:</strong> Unable to determine status
  </StatusBadge>
);

export function AuthStatus({ className, showEmail = true }: AuthStatusProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <LoadingStatus />;
  }

  if (status === 'authenticated' && session?.user?.email) {
    return showEmail ? (
      <AuthenticatedStatus email={session.user.email} />
    ) : (
      <StatusBadge variant="success">
        <strong>Authenticated</strong>
      </StatusBadge>
    );
  }

  if (status === 'unauthenticated') {
    return <UnauthenticatedStatus />;
  }

  // Error fallback
  return <ErrorStatus />;
}