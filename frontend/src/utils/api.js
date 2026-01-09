/**
 * API Configuration with Axios Interceptors
 * Automatically adds JWT token to all requests
 */

import axios from 'axios'
import { auth } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = auth.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      // Get current path - handle both browser and Electron environments
      const currentPath = window.location.pathname || '/'
      const isLoginPage = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/index.html')
      
      // Check if this is a verification endpoint - don't logout for these
      const requestUrl = error.config?.url || ''
      const isVerificationEndpoint = requestUrl.includes('/verify-password') || 
                                     requestUrl.includes('/verify-rfid') || 
                                     requestUrl.includes('/verify-admin') ||
                                     requestUrl.includes('/customers/verify-password')
      
      // Only logout and redirect if NOT on the login page AND NOT a verification endpoint
      // Login page 401s are expected for wrong credentials and should be handled by the login form
      // Verification endpoint 401s are expected for wrong credentials during verification
      if (!isLoginPage && !isVerificationEndpoint) {
        auth.logout()
        
        // Use router-friendly navigation for Electron compatibility
        // Avoid window.location.href which can cause white screen in Electron
        try {
          if (window.location.hash) {
            // Hash-based routing (e.g., /#/)
            window.location.hash = '#/'
          } else {
            window.location.replace('/')
          }
        } catch (e) {
          console.error('Redirect error:', e)
        }
      }
    }
    return Promise.reject(error)
  }
)

export { api, API_URL }
