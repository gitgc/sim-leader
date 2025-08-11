import { fetchLeaderboard } from './api.js'
import { setDrivers } from './state.js'
import { renderLeaderboard, setLoadingUI, showError, updateStats } from './ui.js'

// Load leaderboard data
export async function loadLeaderboard() {
  try {
    setLoadingUI(true)
    const drivers = await fetchLeaderboard()
    setDrivers(drivers)
    renderLeaderboard()
    updateStats()
  } catch (_error) {
    showError('Failed to load leaderboard data. Please check if the server is running.')
  } finally {
    setLoadingUI(false)
  }
}
