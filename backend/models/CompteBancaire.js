const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const CompteBancaire = sequelize.define('CompteBancaire', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  iban: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type_compte: {
    type: DataTypes.ENUM('courant', 'livret_a', 'pel'),
    allowNull: false,
  },
  solde: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
    },
  },
  statut: {
    type: DataTypes.ENUM('actif', 'bloque'),
    defaultValue: 'actif',
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'comptes_bancaires',
  timestamps: false,
});

// Associations
CompteBancaire.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(CompteBancaire, { foreignKey: 'user_id' });

module.exports = CompteBancaire;