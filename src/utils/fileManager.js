const fs = require('node:fs')
const path = require('node:path')

// Delete a file safely
function deleteFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    }
    return false
  } catch (_error) {
    return false
  }
}

// Delete uploaded file with error handling
function cleanupUploadedFile(req) {
  if (req.file && fs.existsSync(req.file.path)) {
    deleteFileIfExists(req.file.path)
  }
}

// Get full file path for public uploads
function getPublicFilePath(relativePath) {
  return path.join(__dirname, '../../public', relativePath)
}

module.exports = {
  deleteFileIfExists,
  cleanupUploadedFile,
  getPublicFilePath,
}
