

'use client'

import { useRequireAuth } from '@/lib/auth/hooks'
import { useState, useEffect } from 'react'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}


export function ProtectedRoute({
  children,
  redirectTo = '/login',
  fallback = <DashboardSkeleton />,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useRequireAuth(redirectTo)
  const [mounted, setMounted] = useState(false)

  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR or before mount, render nothing to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  if (isLoading) {
    return <>{fallback}</>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}


export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/login'
) {
  return function WithAuthComponent(props: P) {
    return (
      <ProtectedRoute redirectTo={redirectTo}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}
