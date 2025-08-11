import { API_BASE_URL } from './state.js'

// Authentication API calls
export async function fetchAuthStatus() {
  const response = await fetch(`${API_BASE_URL}/auth/user`)
  if (response.ok) {
    return response.json()
  }
  throw new Error('Failed to fetch auth status')
}

export async function logoutUser() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Logout failed')
  }

  return response.json()
}

// Leaderboard API calls
export async function fetchLeaderboard() {
  const response = await fetch(`${API_BASE_URL}/leaderboard`)
  if (!response.ok) {
    throw new Error('Failed to load leaderboard')
  }
  return response.json()
}

export async function createDriver(driverData) {
  const response = await fetch(`${API_BASE_URL}/leaderboard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(driverData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to create driver')
  }

  return response.json()
}

export async function updateDriver(driverId, driverData) {
  const response = await fetch(`${API_BASE_URL}/leaderboard/${driverId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(driverData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update driver')
  }

  return response.json()
}

export async function deleteDriver(driverId) {
  const response = await fetch(`${API_BASE_URL}/leaderboard/${driverId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to delete driver')
  }

  return response.json()
}

// Profile picture API calls
export async function uploadProfilePicture(driverId, file) {
  const formData = new FormData()
  formData.append('profilePicture', file)

  const response = await fetch(`${API_BASE_URL}/leaderboard/${driverId}/profile-picture`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to upload profile picture')
  }

  return response.json()
}

export async function deleteProfilePicture(driverId) {
  const response = await fetch(`${API_BASE_URL}/leaderboard/${driverId}/profile-picture`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to delete profile picture')
  }

  return response.json()
}

// Race settings API calls
export async function fetchRaceSettings() {
  const response = await fetch(`${API_BASE_URL}/race-settings`)
  if (!response.ok) {
    throw new Error('Failed to load race settings')
  }
  return response.json()
}

export async function updateRaceSettings(settingsData) {
  const response = await fetch(`${API_BASE_URL}/race-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settingsData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update race settings')
  }

  return response.json()
}

export async function uploadCircuitImage(file) {
  const formData = new FormData()
  formData.append('circuitImage', file)

  const response = await fetch(`${API_BASE_URL}/race-settings/circuit-image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to upload circuit image')
  }

  return response.json()
}

export async function deleteCircuitImage() {
  const response = await fetch(`${API_BASE_URL}/race-settings/circuit-image`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to delete circuit image')
  }

  return response.json()
}

export async function clearNextRace() {
  const response = await fetch(`${API_BASE_URL}/race-settings/clear-next-race`, {
    method: 'POST',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to clear next race')
  }

  return response.json()
}
