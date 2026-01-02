/**
 * Authentication Utility
 * Handles JWT token storage and retrieval
 */

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'user'

export const auth = {
  // Store token
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  // Get token
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  // Remove token
  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },

  // Store user data
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  // Get user data
  getUser() {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },

  // Remove user data
  removeUser() {
    localStorage.removeItem(USER_KEY)
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken()
  },

  // Logout - clear all auth data
  logout() {
    this.removeToken()
    this.removeUser()
  },

  // Login - store token and user
  login(token, user) {
    this.setToken(token)
    this.setUser(user)
  }
}
