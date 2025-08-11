const multer = require('multer')
const path = require('node:path')
const fs = require('node:fs')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let uploadDir
    if (file.fieldname === 'circuitImage') {
      uploadDir = path.join(__dirname, '../../public/uploads/circuits')
    } else {
      uploadDir = path.join(__dirname, '../../public/uploads')
    }

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`)
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
