// API Configuration
const API_BASE_URL = `${window.location.protocol}//${window.location.host}`

// Global state
let drivers = []
let _isLoading = false
let currentUser = null
let isAuthorized = false
let raceSettings = null
let authOperationInProgress = false // Prevent rapid auth operations

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus()
  loadRaceSettings()
  loadLeaderboard()
  setupEventListeners()
})

// Check authentication status
async function checkAuthStatus() {
  // Don't check auth status if another auth operation is in progress
  if (authOperationInProgress) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/user`)
    if (response.ok) {
      const data = await response.json()
      currentUser = data.user
      isAuthorized = data.isAuthorized
      updateAuthUI()
      // Note: UI will be updated on next page load/refresh instead of immediate re-render
    }
  } catch (_error) {}
}

// Update authentication UI
function updateAuthUI() {
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
            <button class="btn btn-logout" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> LOGOUT
            </button>
        `

    // Show settings icon for all authenticated users
    settingsSection.style.display = 'flex'

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
  renderLeaderboard()
}

// Logout function
async function _logout() {
  // Prevent concurrent logout operations
  if (authOperationInProgress) {
    return
  }

  authOperationInProgress = true

  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    })

    if (response.ok) {
      currentUser = null
      isAuthorized = false
      updateAuthUI()
      showNotification('Logged out successfully!', 'info')
    }
  } catch (_error) {
    showNotification('Error logging out. Please try again.', 'error')
  } finally {
    authOperationInProgress = false
  }
}

// Setup event listeners
function setupEventListeners() {
  // Add driver form
  document.getElementById('addDriverForm').addEventListener('submit', handleAddDriver)

  // Edit driver form
  document.getElementById('editDriverForm').addEventListener('submit', handleEditDriver)

  // Settings form
  document.getElementById('settingsForm').addEventListener('submit', handleSettingsUpdate)

  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
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

// Load leaderboard data
async function loadLeaderboard() {
  try {
    setLoading(true)
    const response = await fetch(`${API_BASE_URL}/leaderboard`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    drivers = await response.json()
    renderLeaderboard()
    updateStats()
  } catch (_error) {
    showError('Failed to load leaderboard data. Please check if the server is running.')
  } finally {
    setLoading(false)
  }
}

// Render leaderboard
function renderLeaderboard() {
  const leaderboardElement = document.getElementById('leaderboard')

  if (drivers.length === 0) {
    const addDriverButton = isAuthorized
      ? `<button class="btn btn-primary" onclick="showAddDriverModal()">
                <i class="fas fa-plus"></i> Add First Driver
            </button>`
      : ''

    leaderboardElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <h3>No Drivers Yet</h3>
                <p>${isAuthorized ? 'Add your first driver to start building the championship leaderboard!' : 'No drivers have been added to the championship yet.'}</p>
                ${addDriverButton}
            </div>
        `
    return
  }

  leaderboardElement.innerHTML = drivers
    .map((driver, index) => {
      const position = index + 1
      const positionClass = getPositionClass(position)

      const adminActions = isAuthorized
        ? `
            <div class="actions">
                <button class="btn btn-small btn-edit" onclick="showEditDriverModal(${driver.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-delete" onclick="deleteDriver(${driver.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `
        : '<div class="actions"></div>'

      const driverAvatar = driver.profilePicture
        ? `<img src="${driver.profilePicture}" alt="${escapeHtml(driver.driverName)}" class="driver-avatar">`
        : `<div class="driver-avatar" style="display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #666;">
                <i class="fas fa-user"></i>
            </div>`

      return `
            <div class="driver-entry" data-driver-id="${driver.id}">
                <div class="position ${positionClass}">${position}</div>
                <div class="driver-info">
                    ${driverAvatar}
                    <div class="driver-details">
                        <div class="driver-name">${escapeHtml(driver.driverName)}</div>
                    </div>
                </div>
                <div class="points">
                    <span class="points-value">${driver.points}</span>
                    <span class="points-label">PTS</span>
                </div>
                ${adminActions}
            </div>
        `
    })
    .join('')
}

// Update statistics
function updateStats() {
  const totalDriversElement = document.getElementById('totalDrivers')
  const currentLeaderElement = document.getElementById('currentLeader')
  const highestPointsElement = document.getElementById('highestPoints')

  totalDriversElement.textContent = drivers.length

  if (drivers.length > 0) {
    currentLeaderElement.textContent = drivers[0].driverName
    highestPointsElement.textContent = drivers[0].points
  } else {
    currentLeaderElement.textContent = '-'
    highestPointsElement.textContent = '0'
  }
}

// Get position styling class
function getPositionClass(position) {
  switch (position) {
    case 1:
      return 'gold'
    case 2:
      return 'silver'
    case 3:
      return 'bronze'
    default:
      return ''
  }
}

// Show/Hide loading state
function setLoading(loading) {
  _isLoading = loading
  const leaderboardElement = document.getElementById('leaderboard')

  if (loading) {
    leaderboardElement.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading championship data...</p>
            </div>
        `
  }
}

// Show error message
function showError(message) {
  const leaderboardElement = document.getElementById('leaderboard')
  leaderboardElement.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle" style="color: #ff1e1e;"></i>
            <h3>Error</h3>
            <p>${escapeHtml(message)}</p>
            <button class="btn btn-primary" onclick="loadLeaderboard()">
                <i class="fas fa-refresh"></i> Try Again
            </button>
        </div>
    `
}

// Modal functions
function _showAddDriverModal() {
  if (!isAuthorized) {
    showNotification('You are not authorized to add drivers.', 'error')
    return
  }

  document.getElementById('addDriverModal').style.display = 'block'
  document.getElementById('driverName').focus()
}

function closeAddDriverModal() {
  document.getElementById('addDriverModal').style.display = 'none'
  document.getElementById('addDriverForm').reset()
}

function _showEditDriverModal(driverId) {
  if (!isAuthorized) {
    showNotification('You are not authorized to edit drivers.', 'error')
    return
  }

  const driver = drivers.find((d) => d.id === driverId)
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

function closeEditDriverModal() {
  document.getElementById('editDriverModal').style.display = 'none'
  document.getElementById('editDriverForm').reset()
}

// Handle add driver form submission
async function handleAddDriver(event) {
  event.preventDefault()

  if (!isAuthorized) {
    showNotification('You are not authorized to add drivers.', 'error')
    return
  }

  const formData = new FormData(event.target)
  const driverData = {
    driverName: formData.get('driverName').trim(),
    points: parseInt(formData.get('points')),
  }

  if (!driverData.driverName || Number.isNaN(driverData.points) || driverData.points < 0) {
    alert('Please enter valid driver name and points.')
    return
  }

  try {
    // First create the driver
    const response = await fetch(`${API_BASE_URL}/leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driverData),
    })

    if (response.status === 401) {
      showNotification('Please sign in to add drivers.', 'error')
      return
    }

    if (response.status === 403) {
      showNotification('You are not authorized to add drivers.', 'error')
      return
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const newDriver = await response.json()

    // If there's a profile picture, upload it
    const profilePictureFile = formData.get('profilePicture')
    if (profilePictureFile && profilePictureFile.size > 0) {
      await uploadProfilePictureForDriver(newDriver.id, profilePictureFile)
    }

    closeAddDriverModal()
    await loadLeaderboard()
    showNotification('Driver added successfully!', 'success')
  } catch (_error) {
    showNotification('Failed to add driver. Please try again.', 'error')
  }
}

// Handle edit driver form submission
async function handleEditDriver(event) {
  event.preventDefault()

  if (!isAuthorized) {
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
    alert('Please enter valid driver name and points.')
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/${driverId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driverData),
    })

    if (response.status === 401) {
      showNotification('Please sign in to edit drivers.', 'error')
      return
    }

    if (response.status === 403) {
      showNotification('You are not authorized to edit drivers.', 'error')
      return
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    closeEditDriverModal()
    await loadLeaderboard()
    showNotification('Driver updated successfully!', 'success')
  } catch (_error) {
    showNotification('Failed to update driver. Please try again.', 'error')
  }
}

// Delete driver
async function _deleteDriver(driverId) {
  if (!isAuthorized) {
    showNotification('You are not authorized to delete drivers.', 'error')
    return
  }

  const driver = drivers.find((d) => d.id === driverId)
  if (!driver) return

  if (!confirm(`Are you sure you want to remove ${driver.driverName} from the championship?`)) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/${driverId}`, {
      method: 'DELETE',
    })

    if (response.status === 401) {
      showNotification('Please sign in to delete drivers.', 'error')
      return
    }

    if (response.status === 403) {
      showNotification('You are not authorized to delete drivers.', 'error')
      return
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    await loadLeaderboard()
    showNotification('Driver removed successfully!', 'success')
  } catch (_error) {
    showNotification('Failed to remove driver. Please try again.', 'error')
  }
}

// Refresh leaderboard
function _refreshLeaderboard() {
  loadLeaderboard()
  showNotification('Leaderboard refreshed!', 'info')
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${escapeHtml(message)}</span>
    `

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `

  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Get notification icon
function getNotificationIcon(type) {
  switch (type) {
    case 'success':
      return 'check-circle'
    case 'error':
      return 'exclamation-circle'
    case 'warning':
      return 'exclamation-triangle'
    default:
      return 'info-circle'
  }
}

// Get notification color
function getNotificationColor(type) {
  switch (type) {
    case 'success':
      return 'linear-gradient(45deg, #4CAF50, #45a049)'
    case 'error':
      return 'linear-gradient(45deg, #f44336, #da190b)'
    case 'warning':
      return 'linear-gradient(45deg, #ff9800, #f57c00)'
    default:
      return 'linear-gradient(45deg, #2196F3, #1976D2)'
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Add notification animations to CSS dynamically
const style = document.createElement('style')
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`
document.head.appendChild(style)

// Race Settings Functions
async function loadRaceSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/race-settings`)
    if (response.ok) {
      raceSettings = await response.json()
      renderNextRaceSection()
    }
  } catch (_error) {}
}

function renderNextRaceSection() {
  const nextRaceSection = document.getElementById('nextRaceSection')

  if (!raceSettings || (!raceSettings.nextRaceLocation && !raceSettings.nextRaceDate)) {
    nextRaceSection.innerHTML = `
            <div class="no-race-scheduled">
                <i class="fas fa-calendar-times"></i>
                <h3>No Race Scheduled</h3>
                <p>The next race information will be announced soon.</p>
                ${isAuthorized ? '<p class="form-help">Use the settings icon to configure the next race.</p>' : ''}
            </div>
        `
    return
  }

  const circuitImage = raceSettings.circuitImage
    ? `<img src="${raceSettings.circuitImage}" alt="Circuit layout" class="circuit-image">`
    : ''

  const raceDate = raceSettings.nextRaceDate
    ? `${new Date(raceSettings.nextRaceDate).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })} (displayed in your local time)`
    : ''

  nextRaceSection.innerHTML = `
        <div class="next-race-header">
            <i class="fas fa-flag-checkered"></i>
            <h3>NEXT RACE</h3>
        </div>
        <div class="next-race-content">
            <div class="race-details">
                ${raceSettings.nextRaceLocation ? `<div class="race-location">${escapeHtml(raceSettings.nextRaceLocation)}</div>` : ''}
                ${raceDate ? `<div class="race-date">${raceDate}</div>` : ''}
                ${raceSettings.raceDescription ? `<div class="race-description">${escapeHtml(raceSettings.raceDescription)}</div>` : ''}
            </div>
            ${circuitImage ? `<div class="circuit-display">${circuitImage}</div>` : ''}
        </div>
    `
}

function _showSettingsModal() {
  if (!currentUser) {
    showNotification('Please sign in to access settings.', 'error')
    return
  }

  // Populate form with current settings
  if (raceSettings) {
    document.getElementById('nextRaceLocation').value = raceSettings.nextRaceLocation || ''
    document.getElementById('raceDescription').value = raceSettings.raceDescription || ''

    if (raceSettings.nextRaceDate) {
      // Convert from UTC to PST for editing (PST is UTC-8)
      const date = new Date(raceSettings.nextRaceDate)
      const pstDate = new Date(date.getTime() - 8 * 60 * 60 * 1000)
      const pstDateTime = new Date(pstDate.getTime() - pstDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      document.getElementById('nextRaceDate').value = pstDateTime
    }

    // Handle circuit image display
    const currentCircuitImage = document.getElementById('currentCircuitImage')
    const noCircuitImageText = document.getElementById('noCircuitImageText')
    const deleteCircuitImageBtn = document.getElementById('deleteCircuitImageBtn')

    if (raceSettings.circuitImage) {
      currentCircuitImage.src = raceSettings.circuitImage
      currentCircuitImage.style.display = 'block'
      noCircuitImageText.style.display = 'none'
      deleteCircuitImageBtn.style.display = 'inline-flex'
    } else {
      currentCircuitImage.style.display = 'none'
      noCircuitImageText.style.display = 'block'
      deleteCircuitImageBtn.style.display = 'none'
    }
  }

  document.getElementById('settingsModal').style.display = 'block'
  document.getElementById('nextRaceLocation').focus()
}

function closeSettingsModal() {
  document.getElementById('settingsModal').style.display = 'none'
  document.getElementById('settingsForm').reset()
}

async function handleSettingsUpdate(event) {
  event.preventDefault()

  if (!currentUser) {
    showNotification('Please sign in to update settings.', 'error')
    return
  }

  const formData = new FormData(event.target)
  const settingsData = {
    nextRaceLocation: formData.get('nextRaceLocation').trim(),
    nextRaceDate: formData.get('nextRaceDate') || null,
    raceDescription: formData.get('raceDescription').trim(),
  }

  try {
    const response = await fetch(`${API_BASE_URL}/race-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsData),
    })

    if (response.status === 401) {
      showNotification('Please sign in to update settings.', 'error')
      return
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    raceSettings = await response.json()
    closeSettingsModal()
    renderNextRaceSection()
    showNotification('Race settings updated successfully!', 'success')
  } catch (_error) {
    showNotification('Failed to update race settings. Please try again.', 'error')
  }
}

async function _clearNextRace() {
  if (!currentUser) {
    showNotification('Please sign in to clear race settings.', 'error')
    return
  }

  const confirmed = confirm(
    'Are you sure you want to clear the next race? This will remove all race information including location, date, description, and circuit image.'
  )

  if (!confirmed) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/race-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nextRaceLocation: '',
        nextRaceDate: null,
        raceDescription: '',
      }),
    })

    if (response.status === 401) {
      showNotification('Please sign in to clear race settings.', 'error')
      return
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    raceSettings = await response.json()

    // Try to clear the circuit image (ignore errors if no image exists)
    try {
      await fetch(`${API_BASE_URL}/race-settings/circuit-image`, {
        method: 'DELETE',
      })
    } catch (_imageError) {}

    // Clear the form fields
    document.getElementById('nextRaceLocation').value = ''
    document.getElementById('nextRaceDate').value = ''
    document.getElementById('raceDescription').value = ''

    // Update the circuit image display
    const currentCircuitImage = document.getElementById('currentCircuitImage')
    const noCircuitImageText = document.getElementById('noCircuitImageText')
    const deleteCircuitImageBtn = document.getElementById('deleteCircuitImageBtn')

    currentCircuitImage.style.display = 'none'
    noCircuitImageText.style.display = 'block'
    deleteCircuitImageBtn.style.display = 'none'

    renderNextRaceSection()
    showNotification('Next race cleared successfully!', 'success')
  } catch (_error) {
    showNotification('Failed to clear race settings. Please try again.', 'error')
  }
}

function _triggerCircuitImageUpload() {
  document.getElementById('circuitImageUpload').click()
}

async function _uploadCircuitImage() {
  const fileInput = document.getElementById('circuitImageUpload')
  const file = fileInput.files[0]

  if (!file) return

  if (!currentUser) {
    showNotification('Please sign in to upload circuit images.', 'error')
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showNotification('File size must be less than 5MB.', 'error')
    return
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showNotification('Please select a valid image file.', 'error')
    return
  }

  try {
    const formData = new FormData()
    formData.append('circuitImage', file)

    const response = await fetch(`${API_BASE_URL}/race-settings/circuit-image`, {
      method: 'POST',
      body: formData,
    })

    if (response.status === 401) {
      showNotification('Please sign in to upload circuit images.', 'error')
      return
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await response.json()
    showNotification('Circuit image uploaded successfully!', 'success')

    // Update the current image display
    const currentCircuitImage = document.getElementById('currentCircuitImage')
    const noCircuitImageText = document.getElementById('noCircuitImageText')
    const deleteCircuitImageBtn = document.getElementById('deleteCircuitImageBtn')

    currentCircuitImage.src = result.circuitImage
    currentCircuitImage.style.display = 'block'
    noCircuitImageText.style.display = 'none'
    deleteCircuitImageBtn.style.display = 'inline-flex'

    // Update race settings and re-render
    if (raceSettings) {
      raceSettings.circuitImage = result.circuitImage
      renderNextRaceSection()
    }
  } catch (error) {
    showNotification(`Failed to upload circuit image: ${error.message}`, 'error')
  }

  // Clear the file input
  fileInput.value = ''
}

async function _deleteCircuitImage() {
  if (!currentUser) {
    showNotification('Please sign in to delete circuit images.', 'error')
    return
  }

  if (!confirm('Are you sure you want to delete this circuit image?')) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/race-settings/circuit-image`, {
      method: 'DELETE',
    })

    if (response.status === 401) {
      showNotification('Please sign in to delete circuit images.', 'error')
      return
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    showNotification('Circuit image deleted successfully!', 'success')

    // Update the current image display
    const currentCircuitImage = document.getElementById('currentCircuitImage')
    const noCircuitImageText = document.getElementById('noCircuitImageText')
    const deleteCircuitImageBtn = document.getElementById('deleteCircuitImageBtn')

    currentCircuitImage.style.display = 'none'
    noCircuitImageText.style.display = 'block'
    deleteCircuitImageBtn.style.display = 'none'

    // Update race settings and re-render
    if (raceSettings) {
      raceSettings.circuitImage = null
      renderNextRaceSection()
    }
  } catch (_error) {
    showNotification('Failed to delete circuit image. Please try again.', 'error')
  }
}

// Profile Picture Functions
function _triggerFileUpload() {
  document.getElementById('profilePictureEdit').click()
}

async function _uploadProfilePicture() {
  const fileInput = document.getElementById('profilePictureEdit')
  const file = fileInput.files[0]
  const driverId = document.getElementById('editDriverId').value

  if (!file) return

  await uploadProfilePictureForDriver(driverId, file)

  // Clear the file input
  fileInput.value = ''
}

async function uploadProfilePictureForDriver(driverId, file) {
  if (!isAuthorized) {
    showNotification('You are not authorized to upload profile pictures.', 'error')
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showNotification('File size must be less than 5MB.', 'error')
    return
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showNotification('Please select a valid image file.', 'error')
    return
  }

  try {
    const formData = new FormData()
    formData.append('profilePicture', file)

    const response = await fetch(`${API_BASE_URL}/leaderboard/${driverId}/profile-picture`, {
      method: 'POST',
      body: formData,
    })

    if (response.status === 401) {
      showNotification('Please sign in to upload profile pictures.', 'error')
      return
    }

    if (response.status === 403) {
      showNotification('You are not authorized to upload profile pictures.', 'error')
      return
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await response.json()
    showNotification('Profile picture uploaded successfully!', 'success')

    // Update the current picture display if in edit modal
    if (document.getElementById('editDriverModal').style.display === 'block') {
      const currentPicture = document.getElementById('currentPicture')
      const noPictureText = document.getElementById('noPictureText')
      const deletePictureBtn = document.getElementById('deletePictureBtn')

      currentPicture.src = result.profilePicture
      currentPicture.style.display = 'block'
      noPictureText.style.display = 'none'
      deletePictureBtn.style.display = 'inline-flex'
    }

    // Refresh leaderboard to show new picture
    await loadLeaderboard()
  } catch (error) {
    showNotification(`Failed to upload profile picture: ${error.message}`, 'error')
  }
}

async function _deleteProfilePicture() {
  if (!isAuthorized) {
    showNotification('You are not authorized to delete profile pictures.', 'error')
    return
  }

  const driverId = document.getElementById('editDriverId').value

  if (!confirm('Are you sure you want to delete this profile picture?')) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/${driverId}/profile-picture`, {
      method: 'DELETE',
    })

    if (response.status === 401) {
      showNotification('Please sign in to delete profile pictures.', 'error')
      return
    }

    if (response.status === 403) {
      showNotification('You are not authorized to delete profile pictures.', 'error')
      return
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    showNotification('Profile picture deleted successfully!', 'success')

    // Update the current picture display
    const currentPicture = document.getElementById('currentPicture')
    const noPictureText = document.getElementById('noPictureText')
    const deletePictureBtn = document.getElementById('deletePictureBtn')

    currentPicture.style.display = 'none'
    noPictureText.style.display = 'block'
    deletePictureBtn.style.display = 'none'

    // Refresh leaderboard
    await loadLeaderboard()
  } catch (_error) {
    showNotification('Failed to delete profile picture. Please try again.', 'error')
  }
}
