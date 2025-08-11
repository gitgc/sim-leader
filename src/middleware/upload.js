const multer = require('multer')
const path = require('node:path')
const fs = require('node:fs')
const { v4: uuidv4 } = require('uuid')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let uploadDir
    if (file.fieldname === 'circuitImage') {
      uploadDir = path.join(__dirname, '../../public/uploads/images-circuit')
    } else {
      // For profilePicture and other driver-related images
      uploadDir = path.join(__dirname, '../../public/uploads/images-driver')
    }

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    // Generate GUID-based filename to avoid weird characters
    const guid = uuidv4()
    const extension = path.extname(file.originalname).toLowerCase()
    cb(null, `${guid}${extension}`)
  },
})

const fileFilter = (_req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

module.exports = { upload }
