import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './schema'

// Base URL for API - can be overridden with environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// Auth middleware to inject JWT token
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    // Get token from localStorage or your auth system
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }

    return request
  },
}

// Error handling middleware
const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) {
      const body = await response.clone().json().catch(() => ({}))

      // Handle different error types
      if (response.status === 401) {
        // Unauthorized - redirect to login or refresh token
        console.error('Unauthorized request - token may be expired')
        // TODO: Implement token refresh or redirect to login
      } else if (response.status === 403) {
        console.error('Forbidden - insufficient permissions')
      } else if (response.status >= 500) {
        console.error('Server error:', body)
      }
    }

    return response
  },
}

// Logging middleware for development
const loggingMiddleware: Middleware = {
  async onRequest({ request }) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${request.method} ${request.url}`)
    }
    return request
  },
  async onResponse({ response }) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${response.status} ${response.url}`)
    }
    return response
  },
}

// Create the typed API client
export const apiClient = createClient<paths>({
  baseUrl: BASE_URL,
})

// Apply middleware
apiClient.use(loggingMiddleware)
apiClient.use(authMiddleware)
apiClient.use(errorMiddleware)

// Export typed client
export type ApiClient = typeof apiClient

// Helper function to handle API errors
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }
  return 'An unexpected error occurred'
}

// Example usage types
export type GetProfileResponse = paths['/users/me']['get']['responses']['200']['content']['application/json']
export type UpdateProfileRequest = paths['/users/me']['patch']['requestBody']['content']['application/json']
