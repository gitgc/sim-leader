import { getDrivers, getIsAuthorized, setIsLoading } from './state.js'
import { escapeHtml, getPositionClass } from './utils.js'

// Render leaderboard
export function renderLeaderboard() {
  const drivers = getDrivers()
  const isAuthorized = getIsAuthorized()
  const leaderboardElement = document.getElementById('leaderboard')

  if (drivers.length === 0) {
    const addDriverButton = isAuthorized
      ? `<button class="btn btn-primary" data-action="showAddDriverModal">
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
            <button class="btn btn-small btn-edit" data-action="showEditDriverModal" data-driver-id="${driver.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-small btn-delete" data-action="deleteDriver" data-driver-id="${driver.id}">
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
export function updateStats() {
  const drivers = getDrivers()
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

// Show/Hide loading state
export function setLoadingUI(loading) {
  setIsLoading(loading)
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
export function showError(message) {
  const leaderboardElement = document.getElementById('leaderboard')
  leaderboardElement.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-exclamation-triangle" style="color: #ff1e1e;"></i>
      <h3>Error</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-primary" data-action="loadLeaderboard">
        <i class="fas fa-refresh"></i> Try Again
      </button>
    </div>
  `
}

// Render next race section
export function renderNextRaceSection() {
  const nextRaceSection = document.getElementById('nextRaceSection')
  const nextRaceInfo = document.getElementById('nextRaceInfo')

  // This will be implemented when we migrate the settings module
  // For now, just ensure elements exist
  if (nextRaceSection && nextRaceInfo) {
    // Implementation will be in settings.js
  }
}
