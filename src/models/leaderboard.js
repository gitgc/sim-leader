const { Model, DataTypes } = require('sequelize')
const sequelize = require('../config/db')

class Leaderboard extends Model {}

Leaderboard.init(
  {
    driverName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'leaderboard',
  }
)

module.exports = Leaderboard
