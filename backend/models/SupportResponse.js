const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupportResponse = sequelize.define('SupportResponse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'support_tickets',
      key: 'id'
    }
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'support_responses',
  timestamps: false,
});

// Associations
SupportResponse.associate = (models) => {
  SupportResponse.belongsTo(models.SupportTicket, { foreignKey: 'ticket_id', as: 'ticket' });
  SupportResponse.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
};

module.exports = SupportResponse;