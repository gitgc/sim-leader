const { describe, test, expect, beforeEach } = require('@jest/globals')

// Mock passport before requiring the auth module
jest.mock('passport', () => ({
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  initialize: jest.fn(() => (_req, _res, next) => next()),
  session: jest.fn(() => (_req, _res, next) => next()),
}))

jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn(),
}))

describe('Authentication Module', () => {
  let mockReq, mockRes, mockNext
  let auth

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Set up test environment variables
    process.env.AUTHORIZED_EMAILS = 'admin@test.com,user@test.com'

    // Mock request and response objects
    mockReq = {
      isAuthenticated: jest.fn(),
      user: null,
    }

    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
      redirect: jest.fn(() => mockRes),
    }

    mockNext = jest.fn()

    // Require the auth module after setting up mocks
    auth = require('../../src/config/auth')
  })

  describe('isAuthenticated middleware', () => {
    test('should call next() when user is authenticated', () => {
      mockReq.isAuthenticated.mockReturnValue(true)
      mockReq.user = { email: 'test@example.com' }

      auth.isAuthenticated(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    test('should return 401 when user is not authenticated', () => {
      mockReq.isAuthenticated.mockReturnValue(false)

      auth.isAuthenticated(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' })
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('isAuthorized middleware', () => {
    test('should call next() when user is authenticated and authorized', () => {
      mockReq.isAuthenticated.mockReturnValue(true)
      mockReq.user = { email: 'admin@test.com' }

      auth.isAuthorized(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    test('should return 401 when user is not authenticated', () => {
      mockReq.isAuthenticated.mockReturnValue(false)

      auth.isAuthorized(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should return 403 when user is authenticated but not authorized', () => {
      mockReq.isAuthenticated.mockReturnValue(true)
      mockReq.user = { email: 'unauthorized@test.com' }

      auth.isAuthorized(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. You are not authorized to perform this action.',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should handle missing AUTHORIZED_EMAILS environment variable', () => {
      delete process.env.AUTHORIZED_EMAILS

      mockReq.isAuthenticated.mockReturnValue(true)
      mockReq.user = { email: 'any@test.com' }

      auth.isAuthorized(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. You are not authorized to perform this action.',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should handle empty AUTHORIZED_EMAILS environment variable', () => {
      process.env.AUTHORIZED_EMAILS = ''

      mockReq.isAuthenticated.mockReturnValue(true)
      mockReq.user = { email: 'any@test.com' }

      auth.isAuthorized(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. You are not authorized to perform this action.',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test('should trim whitespace from authorized emails', () => {
      process.env.AUTHORIZED_EMAILS = ' admin@test.com , user@test.com '

      mockReq.isAuthenticated.mockReturnValue(true)
      mockReq.user = { email: 'admin@test.com' }

      auth.isAuthorized(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    test('should be case sensitive for email matching', () => {
      mockReq.isAuthenticated.mockReturnValue(true)
      mockReq.user = { email: 'ADMIN@TEST.COM' }

      auth.isAuthorized(mockReq, mockRes, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. You are not authorized to perform this action.',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})
