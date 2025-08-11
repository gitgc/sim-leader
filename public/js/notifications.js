import { escapeHtml } from './utils.js'

// Show notification
export function showNotification(message, type = 'info') {
  // Create notification container if it doesn't exist
  let container = document.getElementById('notification-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'notification-container'
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `
    document.body.appendChild(container)
    addNotificationStyles()
  }

  // Create notification element
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.style.cssText = `
    background: ${getNotificationColor(type)};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 350px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    cursor: pointer;
  `

  notification.innerHTML = `
    ${getNotificationIcon(type)}
    <span>${escapeHtml(message)}</span>
  `

  // Add click to dismiss
  notification.addEventListener('click', () => {
    removeNotification(notification)
  })

  // Add to container
  container.appendChild(notification)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    removeNotification(notification)
  }, 5000)
}

// Remove notification with animation
function removeNotification(notification) {
  if (notification?.parentNode) {
    notification.style.animation = 'slideOut 0.3s ease-in'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }
}

// Get notification icon
function getNotificationIcon(type) {
  switch (type) {
    case 'success':
      return '<i class="fas fa-check-circle"></i>'
    case 'error':
      return '<i class="fas fa-exclamation-circle"></i>'
    case 'warning':
      return '<i class="fas fa-exclamation-triangle"></i>'
    default:
      return '<i class="fas fa-info-circle"></i>'
  }
}

// Get notification color
function getNotificationColor(type) {
  switch (type) {
    case 'success':
      return '#10B981'
    case 'error':
      return '#EF4444'
    case 'warning':
      return '#F59E0B'
    default:
      return '#3B82F6'
  }
}

// Add notification animations to CSS dynamically
function addNotificationStyles() {
  if (document.getElementById('notification-styles')) return

  const style = document.createElement('style')
  style.id = 'notification-styles'
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .notification:hover {
      transform: translateX(-5px);
      transition: transform 0.2s ease;
    }
  `
  document.head.appendChild(style)
}
