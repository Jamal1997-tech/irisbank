const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactMessage = sequelize.define('ContactMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sujet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'contact_messages',
  timestamps: false,
});

module.exports = ContactMessage;