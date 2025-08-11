import { showNotification } from './notifications.js'
import { findDriverById, getIsAuthorized } from './state.js'

// Show add driver modal
export function showAddDriverModal() {
  if (!getIsAuthorized()) {
    showNotification('You are not authorized to add drivers.', 'error')
    return
  }

  document.getElementById('addDriverModal').style.display = 'block'
  document.getElementById('driverName').focus()
}

// Close add driver modal
export function closeAddDriverModal() {
  document.getElementById('addDriverModal').style.display = 'none'
  document.getElementById('addDriverForm').reset()
}

// Show edit driver modal
export function showEditDriverModal(driverId) {
  if (!getIsAuthorized()) {
    showNotification('You are not authorized to edit drivers.', 'error')
    return
  }

  const driver = findDriverById(driverId)
  if (!driver) return

  document.getElementById('editDriverId').value = driver.id
  document.getElementById('editDriverName').value = driver.driverName
  document.getElementById('editPoints').value = driver.points

  // Handle profile picture display
  const currentPicture = document.getElementById('currentPicture')
  const noPictureText = document.getElementById('noPictureText')
  const deletePictureBtn = document.getElementById('deletePictureBtn')

  if (driver.profilePicture) {
    currentPicture.src = driver.profilePicture
    currentPicture.style.display = 'block'
    noPictureText.style.display = 'none'
    deletePictureBtn.style.display = 'inline-flex'
  } else {
    currentPicture.style.display = 'none'
    noPictureText.style.display = 'block'
    deletePictureBtn.style.display = 'none'
  }

  document.getElementById('editDriverModal').style.display = 'block'
  document.getElementById('editDriverName').focus()
}

// Close edit driver modal
export function closeEditDriverModal() {
  document.getElementById('editDriverModal').style.display = 'none'
  document.getElementById('editDriverForm').reset()
}

// Show settings modal
export function showSettingsModal() {
  // Double-check authorization status before showing modal
  if (!getIsAuthorized()) {
    showNotification('You are not authorized to access settings.', 'error')
    return
  }

  try {
    const settingsModal = document.getElementById('settingsModal')
    if (!settingsModal) {
      showNotification('Settings modal not found. Please refresh the page.', 'error')
      return
    }

    settingsModal.style.display = 'block'
  } catch (_error) {
    showNotification('Unable to open settings. Please try again.', 'error')
  }
}

// Close settings modal
export function closeSettingsModal() {
  document.getElementById('settingsModal').style.display = 'none'
  document.getElementById('settingsForm').reset()
}

// Setup modal event listeners
export function setupModalEventListeners() {
  // Close modals when clicking outside
  document.addEventListener('click', (event) => {
    const addModal = document.getElementById('addDriverModal')
    const editModal = document.getElementById('editDriverModal')
    const settingsModal = document.getElementById('settingsModal')

    if (event.target === addModal) {
      closeAddDriverModal()
    }
    if (event.target === editModal) {
      closeEditDriverModal()
    }
    if (event.target === settingsModal) {
      closeSettingsModal()
    }
  })
}

// File upload helpers
export function triggerFileUpload() {
  document.getElementById('profilePictureInput').click()
}

export function triggerCircuitImageUpload() {
  document.getElementById('circuitImageInput').click()
}
