import { checkAuthStatus, logout } from './auth.js'
import { deleteDriver, deleteProfilePicture, setupFormEventListeners } from './forms.js'
import { initializeImagePreviews } from './imagePreview.js'
import { loadLeaderboard } from './leaderboard.js'
import {
  closeAddDriverModal,
  closeEditDriverModal,
  closeSettingsModal,
  setupModalEventListeners,
  showAddDriverModal,
  showEditDriverModal,
  showSettingsModal,
  triggerCircuitImageUpload,
  triggerEditFileUpload,
  triggerFileUpload,
} from './modals.js'
import {
  clearNextRace,
  deleteCircuitImage,
  loadRaceSettings,
  populateSettingsModal,
  setupSettingsEventListeners,
} from './settings.js'

// Initialize the application
function initializeApp() {
  checkAuthStatus()
  loadRaceSettings()
  loadLeaderboard()
  setupEventListeners()
  initializeImagePreviews()
}

// Setup all event listeners
function setupEventListeners() {
  setupModalEventListeners()
  setupFormEventListeners()
  setupSettingsEventListeners()
  setupEventDelegation()
}

// Event delegation handler
function setupEventDelegation() {
  document.addEventListener('click', (event) => {
    const target = event.target
    const action = target.dataset.action
    const driverId = target.dataset.driverId

    // If no action on the direct target, check parent elements (for icon clicks)
    if (!action) {
      const button = target.closest('[data-action]')
      if (button) {
        const buttonAction = button.dataset.action
        const buttonDriverId = button.dataset.driverId

        if (buttonDriverId) {
          handleDriverAction(buttonAction, buttonDriverId)
        } else {
          handleAction(buttonAction)
        }
      }
      return
    }

    // Handle actions that require driver ID
    if (driverId) {
      handleDriverAction(action, driverId)
    } else {
      handleAction(action)
    }
  })
}

// Handle actions that require a driver ID
function handleDriverAction(action, driverId) {
  // Prevent multiple rapid clicks
  const button = document.querySelector(`[data-action="${action}"][data-driver-id="${driverId}"]`)
  if (button?.disabled) return

  if (button) {
    button.disabled = true
    setTimeout(() => {
      button.disabled = false
    }, 1000) // Re-enable after 1 second
  }

  switch (action) {
    case 'showEditDriverModal':
      showEditDriverModal(driverId)
      break
    case 'deleteDriver':
      deleteDriver(driverId)
      break
    default:
      handleAction(action)
  }
}

// Handle actions without driver ID
function handleAction(action) {
  // Prevent multiple rapid clicks for certain actions
  if (['showSettingsModal', 'clearNextRace', 'logout', 'loadLeaderboard'].includes(action)) {
    const button = document.querySelector(`[data-action="${action}"]`)
    if (button?.disabled) return

    if (button) {
      button.disabled = true
      setTimeout(() => {
        button.disabled = false
      }, 1000) // Re-enable after 1 second
    }
  }

  switch (action) {
    case 'showAddDriverModal':
      showAddDriverModal()
      break
    case 'loadLeaderboard':
      loadLeaderboard()
      break
    case 'closeAddDriverModal':
      closeAddDriverModal()
      break
    case 'closeEditDriverModal':
      closeEditDriverModal()
      break
    case 'showSettingsModal':
      showSettingsModal()
      populateSettingsModal()
      break
    case 'closeSettingsModal':
      closeSettingsModal()
      break
    case 'triggerFileUpload':
      triggerFileUpload()
      break
    case 'triggerEditFileUpload':
      triggerEditFileUpload()
      break
    case 'deleteProfilePicture':
      deleteProfilePicture()
      break
    case 'triggerCircuitImageUpload':
      triggerCircuitImageUpload()
      break
    case 'deleteCircuitImage':
      deleteCircuitImage()
      break
    case 'clearNextRace':
      clearNextRace()
      break
    case 'logout':
      logout()
      break
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp)

// Export for potential external use
export { initializeApp }
