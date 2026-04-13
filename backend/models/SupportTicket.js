const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sujet: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  priorite: {
    type: DataTypes.ENUM('basse', 'moyenne', 'haute'),
    defaultValue: 'moyenne',
  },
  statut: {
    type: DataTypes.ENUM('ouvert', 'en_cours', 'resolu', 'ferme'),
    defaultValue: 'ouvert',
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  date_resolution: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'support_tickets',
  timestamps: false,
});

// Associations
SupportTicket.associate = (models) => {
  SupportTicket.belongsTo(models.User, { foreignKey: 'client_id', as: 'client' });
  SupportTicket.hasMany(models.SupportResponse, { foreignKey: 'ticket_id', as: 'responses' });
};

module.exports = SupportTicket;