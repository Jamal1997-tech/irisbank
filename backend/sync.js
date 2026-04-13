const { sequelize } = require('./config/database');
const User = require('./models/User');
const CompteBancaire = require('./models/CompteBancaire');
const Transaction = require('./models/Transaction');
const SupportTicket = require('./models/SupportTicket');
const SupportResponse = require('./models/SupportResponse');
const ContactMessage = require('./models/ContactMessage');

// Définir les associations
User.hasMany(CompteBancaire, { foreignKey: 'user_id' });
CompteBancaire.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Transaction, { foreignKey: 'expediteur_id', as: 'transactionsEnvoyees' });
User.hasMany(Transaction, { foreignKey: 'destinataire_id', as: 'transactionsRecues' });
Transaction.belongsTo(User, { foreignKey: 'expediteur_id', as: 'expediteur' });
Transaction.belongsTo(User, { foreignKey: 'destinataire_id', as: 'destinataire' });

User.hasMany(SupportTicket, { foreignKey: 'client_id', as: 'tickets' });
SupportTicket.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

SupportTicket.hasMany(SupportResponse, { foreignKey: 'ticket_id', as: 'responses' });
SupportResponse.belongsTo(SupportTicket, { foreignKey: 'ticket_id', as: 'ticket' });

User.hasMany(SupportResponse, { foreignKey: 'admin_id', as: 'responses' });
SupportResponse.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

const syncDB = async () => {
  try {
    await sequelize.sync({ force: false }); // Utiliser force: true pour recréer les tables en développement
    console.log('Base de données synchronisée.');
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
  }
};

syncDB();