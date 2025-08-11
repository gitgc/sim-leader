// API Configuration
export const API_BASE_URL = `${window.location.protocol}//${window.location.host}`

// Global application state
export const state = {
  drivers: [],
  isLoading: false,
  currentUser: null,
  isAuthorized: false,
  raceSettings: null,
  authOperationInProgress: false, // Prevent rapid auth operations
}

// State getters
export const getDrivers = () => state.drivers
export const getCurrentUser = () => state.currentUser
export const getIsAuthorized = () => state.isAuthorized
export const getRaceSettings = () => state.raceSettings
export const getIsLoading = () => state.isLoading
export const getAuthOperationInProgress = () => state.authOperationInProgress

// State setters
export const setDrivers = (drivers) => {
  state.drivers = drivers
}

export const setCurrentUser = (user) => {
  state.currentUser = user
}

export const setIsAuthorized = (authorized) => {
  state.isAuthorized = authorized
}

export const setRaceSettings = (settings) => {
  state.raceSettings = settings
}

export const setIsLoading = (loading) => {
  state.isLoading = loading
}

export const setAuthOperationInProgress = (inProgress) => {
  state.authOperationInProgress = inProgress
}

// Add a driver to the state
export const addDriver = (driver) => {
  state.drivers.push(driver)
  // Sort drivers by points (descending)
  state.drivers.sort((a, b) => b.points - a.points)
}

// Update a driver in the state
export const updateDriver = (driverId, updatedDriver) => {
  const index = state.drivers.findIndex((d) => d.id === driverId)
  if (index !== -1) {
    state.drivers[index] = { ...state.drivers[index], ...updatedDriver }
    // Sort drivers by points (descending)
    state.drivers.sort((a, b) => b.points - a.points)
  }
}

// Remove a driver from the state
export const removeDriver = (driverId) => {
  state.drivers = state.drivers.filter((d) => d.id !== driverId)
}

// Find a driver by ID
export const findDriverById = (driverId) => {
  // Convert to number if it's a string to handle both string and number IDs
  const id = typeof driverId === 'string' ? parseInt(driverId, 10) : driverId
  return state.drivers.find((d) => d.id === id)
}
