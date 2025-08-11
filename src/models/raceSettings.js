const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/db')

class RaceSettings extends Model {}

RaceSettings.init(
  {
    nextRaceLocation: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    nextRaceDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    circuitImage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    raceDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'raceSettings',
  }
)

module.exports = RaceSettings
