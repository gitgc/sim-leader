import {
  deleteDriver as apiDeleteDriver,
  updateDriver as apiUpdateDriver,
  createDriver,
  uploadProfilePicture,
} from './api.js'
import { loadLeaderboard } from './leaderboard.js'
import { closeAddDriverModal, closeEditDriverModal } from './modals.js'
import { showNotification } from './notifications.js'
import { API_BASE_URL, findDriverById, getIsAuthorized } from './state.js'

// Handle add driver form submission
export async function handleAddDriver(event) {
  event.preventDefault()

  if (!getIsAuthorized()) {
    showNotification('You are not authorized to add drivers.', 'error')
    return
  }

  const formData = new FormData(event.target)
  const driverData = {
    driverName: formData.get('driverName').trim(),
    points: parseInt(formData.get('points')),
  }

  if (!driverData.driverName || Number.isNaN(driverData.points) || driverData.points < 0) {
    showNotification('Please enter valid driver name and points.', 'error')
    return
  }

  try {
    // First create the driver
    const newDriver = await createDriver(driverData)

    // If there's a profile picture, upload it
    const profilePictureFile = formData.get('profilePicture')
    if (profilePictureFile && profilePictureFile.size > 0) {
      await uploadProfilePictureForDriver(newDriver.id, profilePictureFile)
    }

    closeAddDriverModal()
    await loadLeaderboard()
    showNotification('Driver added successfully!', 'success')
  } catch (error) {
    if (error.message.includes('401')) {
      showNotification('Please sign in to add drivers.', 'error')
    } else if (error.message.includes('403')) {
      showNotification('You are not authorized to add drivers.', 'error')
    } else {
      showNotification('Failed to add driver. Please try again.', 'error')
    }
  }
}

// Handle edit driver form submission
export async function handleEditDriver(event) {
  event.preventDefault()

  if (!getIsAuthorized()) {
    showNotification('You are not authorized to edit drivers.', 'error')
    return
  }

  const formData = new FormData(event.target)
  const driverId = document.getElementById('editDriverId').value
  const driverData = {
    driverName: formData.get('driverName').trim(),
    points: parseInt(formData.get('points')),
  }

  if (!driverData.driverName || Number.isNaN(driverData.points) || driverData.points < 0) {
    showNotification('Please enter valid driver name and points.', 'error')
    return
  }

  try {
    await apiUpdateDriver(driverId, driverData)
    closeEditDriverModal()
    await loadLeaderboard()
    showNotification('Driver updated successfully!', 'success')
  } catch (error) {
    if (error.message.includes('401')) {
      showNotification('Please sign in to edit drivers.', 'error')
    } else if (error.message.includes('403')) {
      showNotification('You are not authorized to edit drivers.', 'error')
    } else {
      showNotification('Failed to update driver. Please try again.', 'error')
    }
  }
}

// Delete driver
export async function deleteDriver(driverId) {
  if (!getIsAuthorized()) {
    showNotification('You are not authorized to delete drivers.', 'error')
    return
  }

  const driver = findDriverById(driverId)
  if (!driver) return

  if (!confirm(`Are you sure you want to remove ${driver.driverName} from the championship?`)) {
    return
  }

  try {
    await apiDeleteDriver(driverId)
    await loadLeaderboard()
    showNotification('Driver removed successfully!', 'success')
  } catch (error) {
    if (error.message.includes('401')) {
      showNotification('Please sign in to delete drivers.', 'error')
    } else if (error.message.includes('403')) {
      showNotification('You are not authorized to delete drivers.', 'error')
    } else {
      showNotification('Failed to remove driver. Please try again.', 'error')
    }
  }
}

// Upload profile picture for a driver
async function uploadProfilePictureForDriver(driverId, file) {
  try {
    await uploadProfilePicture(driverId, file)
  } catch (_error) {
    showNotification('Failed to upload profile picture', 'warning')
    // Don't throw - we don't want to prevent driver creation if picture upload fails
  }
}

// Delete profile picture
export async function deleteProfilePicture() {
  const driverId = document.getElementById('editDriverId').value
  if (!driverId) return

  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/${driverId}/profile-picture`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete profile picture')
    }

    // Update UI immediately
    const currentPicture = document.getElementById('currentPicture')
    const noPictureText = document.getElementById('noPictureText')
    const deletePictureBtn = document.getElementById('deletePictureBtn')

    currentPicture.style.display = 'none'
    noPictureText.style.display = 'block'
    deletePictureBtn.style.display = 'none'

    showNotification('Profile picture deleted successfully!', 'success')
  } catch (_error) {
    showNotification('Failed to delete profile picture. Please try again.', 'error')
  }
}

// Setup form event listeners
export function setupFormEventListeners() {
  // Add driver form
  const addDriverForm = document.getElementById('addDriverForm')
  if (addDriverForm) {
    addDriverForm.addEventListener('submit', handleAddDriver)
  }

  // Edit driver form
  const editDriverForm = document.getElementById('editDriverForm')
  if (editDriverForm) {
    editDriverForm.addEventListener('submit', handleEditDriver)
  }
}
