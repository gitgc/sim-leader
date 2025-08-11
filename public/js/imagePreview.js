// Image preview functionality for profile pictures
import { showNotification } from './notifications.js'
import { uploadCircuitImage } from './api.js'
import { loadRaceSettings, populateSettingsModal } from './settings.js'

/**
 * Setup image preview for file input
 * @param {string} fileInputId - ID of the file input element
 * @param {string} previewContainerId - ID of the preview container
 * @param {string} previewImageId - ID of the preview image element
 */
export function setupImagePreview(fileInputId, previewContainerId, previewImageId) {
  const fileInput = document.getElementById(fileInputId)
  const previewContainer = document.getElementById(previewContainerId)
  const previewImage = document.getElementById(previewImageId)

  if (!fileInput || !previewContainer || !previewImage) {
    console.warn(`Image preview setup failed: Missing elements for ${fileInputId}`)
    return
  }

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0]
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error')
        clearPreview(previewContainerId, previewImageId)
        return
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        showNotification('File size must be less than 5MB', 'error')
        clearPreview(previewContainerId, previewImageId)
        fileInput.value = '' // Clear the input
        return
      }

      // Create and display preview
      const reader = new FileReader()
      reader.onload = (e) => {
        previewImage.src = e.target.result
        previewContainer.style.display = 'block'
      }
      reader.readAsDataURL(file)

      // For circuit images, upload immediately
      if (fileInputId === 'circuitImageUpload') {
        try {
          await uploadCircuitImage(file)
          showNotification('Circuit image uploaded successfully!', 'success')
          
          // Refresh the race settings and modal
          await loadRaceSettings()
          populateSettingsModal()
          
          // Clear the preview since we now show the actual uploaded image
          clearPreview(previewContainerId, previewImageId)
          fileInput.value = '' // Clear the file input
        } catch (error) {
          showNotification('Failed to upload circuit image. Please try again.', 'error')
          clearPreview(previewContainerId, previewImageId)
          fileInput.value = '' // Clear the file input
        }
      }
    } else {
      clearPreview(previewContainerId, previewImageId)
    }
  })
}

/**
 * Clear image preview
 * @param {string} previewContainerId - ID of the preview container
 * @param {string} previewImageId - ID of the preview image element
 */
export function clearPreview(previewContainerId, previewImageId) {
  const previewContainer = document.getElementById(previewContainerId)
  const previewImage = document.getElementById(previewImageId)
  
  if (previewContainer) {
    previewContainer.style.display = 'none'
  }
  
  if (previewImage) {
    previewImage.src = ''
  }
}

/**
 * Clear all previews (useful when modals are closed)
 */
export function clearAllPreviews() {
  clearPreview('addPicturePreviewContainer', 'addPicturePreview')
  clearPreview('editPicturePreviewContainer', 'editPicturePreview')
  clearPreview('circuitImagePreviewContainer', 'circuitImagePreview')
}

/**
 * Setup all image previews for the application
 */
export function initializeImagePreviews() {
  // Setup preview for add driver modal
  setupImagePreview('profilePictureAdd', 'addPicturePreviewContainer', 'addPicturePreview')
  
  // Setup preview for edit driver modal
  setupImagePreview('profilePictureEdit', 'editPicturePreviewContainer', 'editPicturePreview')
  
  // Setup preview for circuit image upload
  setupImagePreview('circuitImageUpload', 'circuitImagePreviewContainer', 'circuitImagePreview')
}
