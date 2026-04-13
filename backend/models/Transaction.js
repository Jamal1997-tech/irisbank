const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const CompteBancaire = require('./CompteBancaire');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  compte_expediteur_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Null pour dépôts
    references: {
      model: CompteBancaire,
      key: 'id',
    },
  },
  compte_destinataire_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CompteBancaire,
      key: 'id',
    },
  },
  type_transaction: {
    type: DataTypes.ENUM('depot', 'retrait', 'virement'),
    allowNull: false,
  },
  montant: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'transactions',
  timestamps: false,
});

// Associations
Transaction.belongsTo(CompteBancaire, { foreignKey: 'compte_expediteur_id', as: 'Expediteur' });
Transaction.belongsTo(CompteBancaire, { foreignKey: 'compte_destinataire_id', as: 'Destinataire' });

module.exports = Transaction;