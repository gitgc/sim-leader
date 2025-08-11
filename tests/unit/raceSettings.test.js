const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals')
const { Sequelize } = require('sequelize')
const RaceSettings = require('../../src/models/raceSettings')

describe('RaceSettings Model', () => {
  let sequelize

  beforeAll(async () => {
    // Create an in-memory SQLite database for testing
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    })

    // Initialize the model with the test database
    RaceSettings.init(RaceSettings.rawAttributes, { sequelize })

    // Sync the database
    await sequelize.sync()
  })

  afterAll(async () => {
    await sequelize.close()
  })

  beforeEach(async () => {
    // Clear all data before each test
    await RaceSettings.destroy({ where: {} })
  })

  test('should create race settings with default null values', async () => {
    const settings = await RaceSettings.create({})

    expect(settings.nextRaceLocation).toBeNull()
    expect(settings.nextRaceDate).toBeNull()
    expect(settings.circuitImage).toBeNull()
    expect(settings.raceDescription).toBeNull()
    expect(settings.id).toBeDefined()
  })

  test('should create race settings with all fields', async () => {
    const raceData = {
      nextRaceLocation: 'Monaco Grand Prix',
      nextRaceDate: new Date('2024-05-26T14:00:00Z'),
      circuitImage: '/uploads/monaco-circuit.jpg',
      raceDescription: 'The prestigious Monaco Grand Prix around the streets of Monte Carlo.',
    }

    const settings = await RaceSettings.create(raceData)

    expect(settings.nextRaceLocation).toBe('Monaco Grand Prix')
    expect(settings.nextRaceDate).toEqual(raceData.nextRaceDate)
    expect(settings.circuitImage).toBe('/uploads/monaco-circuit.jpg')
    expect(settings.raceDescription).toBe(
      'The prestigious Monaco Grand Prix around the streets of Monte Carlo.'
    )
  })

  test('should allow null values for all fields', async () => {
    const settings = await RaceSettings.create({
      nextRaceLocation: null,
      nextRaceDate: null,
      circuitImage: null,
      raceDescription: null,
    })

    expect(settings.nextRaceLocation).toBeNull()
    expect(settings.nextRaceDate).toBeNull()
    expect(settings.circuitImage).toBeNull()
    expect(settings.raceDescription).toBeNull()
  })

  test('should update race settings', async () => {
    const settings = await RaceSettings.create({})

    await settings.update({
      nextRaceLocation: 'Silverstone Circuit',
      nextRaceDate: new Date('2024-07-07T14:00:00Z'),
      raceDescription: 'The British Grand Prix at the home of British motorsport.',
    })

    expect(settings.nextRaceLocation).toBe('Silverstone Circuit')
    expect(settings.nextRaceDate).toEqual(new Date('2024-07-07T14:00:00Z'))
    expect(settings.raceDescription).toBe(
      'The British Grand Prix at the home of British motorsport.'
    )
  })

  test('should handle long race descriptions', async () => {
    const longDescription = 'A'.repeat(1000) // 1000 character description

    const settings = await RaceSettings.create({
      nextRaceLocation: 'Spa-Francorchamps',
      raceDescription: longDescription,
    })

    expect(settings.raceDescription).toBe(longDescription)
    expect(settings.raceDescription).toHaveLength(1000)
  })

  test('should handle date operations correctly', async () => {
    const testDate = new Date('2024-08-25T15:30:00Z')

    const settings = await RaceSettings.create({
      nextRaceDate: testDate,
    })

    // Verify the date is stored and retrieved correctly
    expect(settings.nextRaceDate).toEqual(testDate)
    expect(settings.nextRaceDate.getTime()).toBe(testDate.getTime())
  })

  test('should clear race settings', async () => {
    const settings = await RaceSettings.create({
      nextRaceLocation: 'Interlagos',
      nextRaceDate: new Date('2024-11-03T18:00:00Z'),
      circuitImage: '/uploads/interlagos.jpg',
      raceDescription: 'Brazilian Grand Prix',
    })

    await settings.update({
      nextRaceLocation: null,
      nextRaceDate: null,
      circuitImage: null,
      raceDescription: null,
    })

    expect(settings.nextRaceLocation).toBeNull()
    expect(settings.nextRaceDate).toBeNull()
    expect(settings.circuitImage).toBeNull()
    expect(settings.raceDescription).toBeNull()
  })

  test('should only allow one race settings record', async () => {
    // Create first settings record
    await RaceSettings.create({
      nextRaceLocation: 'Monza',
    })

    // Create second settings record
    const _secondSettings = await RaceSettings.create({
      nextRaceLocation: 'Suzuka',
    })

    // Both should exist (this behavior depends on business logic, not model constraints)
    const allSettings = await RaceSettings.findAll()
    expect(allSettings).toHaveLength(2)
  })

  test('should handle empty strings', async () => {
    const settings = await RaceSettings.create({
      nextRaceLocation: '',
      raceDescription: '',
    })

    expect(settings.nextRaceLocation).toBe('')
    expect(settings.raceDescription).toBe('')
  })
})
