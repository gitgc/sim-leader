import { fetchAuthStatus, logoutUser } from './api.js'
import { showNotification } from './notifications.js'
import {
  API_BASE_URL,
  getAuthOperationInProgress,
  getCurrentUser,
  getIsAuthorized,
  setAuthOperationInProgress,
  setCurrentUser,
  setIsAuthorized,
} from './state.js'
import { escapeHtml } from './utils.js'

// Check authentication status
export async function checkAuthStatus() {
  // Don't check auth status if another auth operation is in progress
  if (getAuthOperationInProgress()) {
    return
  }

  try {
    const data = await fetchAuthStatus()
    setCurrentUser(data.user)
    setIsAuthorized(data.isAuthorized)
    updateAuthUI()
    // Note: UI will be updated on next page load/refresh instead of immediate re-render
  } catch (_error) {
    // Silently handle auth check failures
  }
}

// Update authentication UI
export async function updateAuthUI() {
  const currentUser = getCurrentUser()
  const isAuthorized = getIsAuthorized()
  const authSection = document.getElementById('authSection')
  const controls = document.getElementById('controls')
  const authNotice = document.getElementById('authNotice')
  const settingsSection = document.getElementById('settingsSection')

  if (currentUser) {
    // User is logged in
    authSection.innerHTML = `
      <div class="user-info">
        <img src="${currentUser.photo}" alt="${currentUser.name}" class="user-avatar">
        <div class="user-details">
          <span class="user-name">${escapeHtml(currentUser.name)}</span>
          <span class="user-status">${isAuthorized ? 'ADMIN ACCESS' : 'READ-ONLY'}</span>
        </div>
      </div>
      <button class="btn btn-logout" data-action="logout">
        <i class="fas fa-sign-out-alt"></i> LOGOUT
      </button>
    `

    // Show settings icon only for authorized users (not just authenticated)
    if (isAuthorized) {
      settingsSection.style.display = 'flex'
    } else {
      settingsSection.style.display = 'none'
    }

    if (isAuthorized) {
      // Show admin controls
      controls.style.display = 'flex'
      authNotice.style.display = 'none'
    } else {
      // Show read-only notice
      controls.style.display = 'none'
      authNotice.style.display = 'block'
    }
  } else {
    // User is not logged in
    authSection.innerHTML = `
      <a href="${API_BASE_URL}/auth/google" class="btn-google">
        <i class="fab fa-google"></i> SIGN IN WITH GOOGLE
      </a>
    `
    controls.style.display = 'none'
    authNotice.style.display = 'block'
    settingsSection.style.display = 'none'
  }

  // Re-render leaderboard to update admin buttons visibility
  // Import dynamically to avoid circular dependency
  const { renderLeaderboard } = await import('./ui.js')
  renderLeaderboard()
}

// Logout function
export async function logout() {
  // Prevent concurrent logout operations
  if (getAuthOperationInProgress()) {
    return
  }

  setAuthOperationInProgress(true)

  try {
    await logoutUser()

    // Clear user state
    setCurrentUser(null)
    setIsAuthorized(false)

    // Update UI
    updateAuthUI()
    showNotification('Successfully logged out', 'success')

    // Redirect to home page
    window.location.href = '/'
  } catch (_error) {
    showNotification('Logout failed. Please try again.', 'error')
  } finally {
    setAuthOperationInProgress(false)
  }
}
