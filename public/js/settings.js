import {
  clearNextRace as apiClearNextRace,
  deleteCircuitImage as apiDeleteCircuitImage,
  fetchRaceSettings,
  updateRaceSettings,
} from './api.js'
import { closeSettingsModal } from './modals.js'
import { showNotification } from './notifications.js'
import { getCurrentUser, getIsAuthorized, getRaceSettings, setRaceSettings } from './state.js'
import { escapeHtml } from './utils.js'

// Load race settings
export async function loadRaceSettings() {
  try {
    const settings = await fetchRaceSettings()
    setRaceSettings(settings)
    renderNextRaceSection()
  } catch (_error) {}
}

// Render next race section
export function renderNextRaceSection() {
  const raceSettings = getRaceSettings()
  const isAuthorized = getIsAuthorized()
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

// Populate settings modal with current data
export function populateSettingsModal() {
  try {
    const raceSettings = getRaceSettings()

    if (raceSettings) {
      // Safely populate form fields with null checks
      const nextRaceLocation = document.getElementById('nextRaceLocation')
      const raceDescription = document.getElementById('raceDescription')
      const nextRaceDate = document.getElementById('nextRaceDate')

      if (nextRaceLocation) nextRaceLocation.value = raceSettings.nextRaceLocation || ''
      if (raceDescription) raceDescription.value = raceSettings.raceDescription || ''

      if (raceSettings.nextRaceDate && nextRaceDate) {
        // Convert from UTC to PST for editing (PST is UTC-8)
        const date = new Date(raceSettings.nextRaceDate)
        const pstDate = new Date(date.getTime() - 8 * 60 * 60 * 1000)
        const pstDateTime = new Date(pstDate.getTime() - pstDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        nextRaceDate.value = pstDateTime
      }

      // Handle circuit image display with null checks
      const currentCircuitImage = document.getElementById('currentCircuitImage')
      const noCircuitImageText = document.getElementById('noCircuitImageText')
      const deleteCircuitImageBtn = document.getElementById('deleteCircuitImageBtn')

      if (currentCircuitImage && noCircuitImageText && deleteCircuitImageBtn) {
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
    }
  } catch (_error) {
    showNotification('Error loading settings data. Some fields may be empty.', 'warning')
  }
}

// Handle settings form submission
export async function handleSettingsUpdate(event) {
  event.preventDefault()

  const currentUser = getCurrentUser()
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
    const updatedSettings = await updateRaceSettings(settingsData)
    setRaceSettings(updatedSettings)
    closeSettingsModal()
    renderNextRaceSection()
    showNotification('Race settings updated successfully!', 'success')
  } catch (error) {
    if (error.message.includes('401')) {
      showNotification('Please sign in to update settings.', 'error')
    } else {
      showNotification('Failed to update race settings. Please try again.', 'error')
    }
  }
}

// Clear next race
export async function clearNextRace() {
  const currentUser = getCurrentUser()
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
    const clearedSettings = await apiClearNextRace()
    setRaceSettings(clearedSettings)
    renderNextRaceSection()

    // If the settings modal is currently open, repopulate it with the cleared data
    const settingsModal = document.getElementById('settingsModal')
    if (settingsModal && settingsModal.style.display === 'block') {
      populateSettingsModal()
    }

    showNotification('Next race cleared successfully!', 'success')
  } catch (error) {
    if (error.message.includes('401')) {
      showNotification('Please sign in to clear race settings.', 'error')
    } else {
      showNotification('Failed to clear race settings. Please try again.', 'error')
    }
  }
}

// Delete circuit image
export async function deleteCircuitImage() {
  try {
    await apiDeleteCircuitImage()

    // Update UI immediately
    const currentCircuitImage = document.getElementById('currentCircuitImage')
    const noCircuitImageText = document.getElementById('noCircuitImageText')
    const deleteCircuitImageBtn = document.getElementById('deleteCircuitImageBtn')

    currentCircuitImage.style.display = 'none'
    noCircuitImageText.style.display = 'block'
    deleteCircuitImageBtn.style.display = 'none'

    showNotification('Circuit image deleted successfully!', 'success')
  } catch (_error) {
    showNotification('Failed to delete circuit image. Please try again.', 'error')
  }
}

// Setup settings form event listeners
export function setupSettingsEventListeners() {
  const settingsForm = document.getElementById('settingsForm')
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleSettingsUpdate)
  }
}
