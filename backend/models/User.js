const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date_naissance: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('client', 'admin'),
    defaultValue: 'client',
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;