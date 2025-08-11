const winston = require('winston')
const path = require('node:path')

// Define custom log levels and colors
const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
}

const logColors = {
  fatal: 'red',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  trace: 'magenta',
}

// Add custom colors to winston
winston.addColors(logColors)

// Create logs directory if it doesn't exist
const fs = require('node:fs')
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`
    }

    // Add additional metadata if present
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''

    return log + metaString
  })
)

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize({ all: true }), logFormat),
    }),

    // Write all logs to combined.log with daily rotation
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 14, // Keep 2 weeks of logs
      tailable: true,
      zippedArchive: true,
    }),

    // Write error logs to error.log with daily rotation
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 30, // Keep 1 month of error logs
      tailable: true,
      zippedArchive: true,
    }),

    // Write debug logs to debug.log with smaller retention
    new winston.transports.File({
      filename: path.join(logsDir, 'debug.log'),
      level: 'debug',
      maxsize: 5242880, // 5MB
      maxFiles: 7, // Keep 1 week of debug logs
      tailable: true,
      zippedArchive: true,
    }),
  ],

  // Handle uncaught exceptions and unhandled rejections with rotation
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true,
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true,
    }),
  ],
})

// Create helper functions for common logging patterns
logger.logRequest = (req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const { method, url, originalUrl, ip } = req
    const { statusCode } = res

    const level = statusCode >= 400 ? 'warn' : 'info'
    logger.log(level, `${method} ${originalUrl || url}`, {
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.get('User-Agent'),
      forwardedFor: req.get('X-Forwarded-For'),
      realIP: req.get('X-Real-IP'),
    })
  })

  if (next) next()
}

logger.logError = (error, context = {}) => {
  logger.error('Application error occurred', {
    error: error.message,
    stack: error.stack,
    ...context,
  })
}

logger.logAuth = (action, user, success = true, details = {}) => {
  const level = success ? 'info' : 'warn'
  logger.log(level, `Authentication ${action}`, {
    user: user?.email || user?.id || 'unknown',
    success,
    ...details,
  })
}

logger.logDatabase = (operation, table, details = {}) => {
  logger.debug(`Database ${operation} on ${table}`, details)
}

logger.logFileOperation = (operation, filename, success = true, details = {}) => {
  const level = success ? 'info' : 'error'
  logger.log(level, `File ${operation}: ${filename}`, {
    success,
    ...details,
  })
}

// In development, set log level to debug only if LOG_LEVEL is not explicitly set
if (process.env.NODE_ENV === 'development' && !process.env.LOG_LEVEL) {
  logger.level = 'debug'
}

module.exports = logger
