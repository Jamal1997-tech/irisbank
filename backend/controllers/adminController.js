const User = require('../models/User');
const CompteBancaire = require('../models/CompteBancaire');
const Transaction = require('../models/Transaction');
const { sequelize } = require('../config/database');

const getAllUsers = async (req, res) => {
  try {
    // Données fictives pour les tests
    const users = [
      { id: 1, nom: 'Admin', prenom: 'System', email: 'admin@irisbank.com', role: 'admin', date_creation: new Date() },
      { id: 2, nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@iris.fr', role: 'user', date_creation: new Date() },
      { id: 3, nom: 'Martin', prenom: 'Marie', email: 'marie.martin@iris.fr', role: 'user', date_creation: new Date() }
    ];
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    await user.update(updates);
    res.json({ message: 'Utilisateur mis à jour.', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    await user.destroy();
    res.json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression.', error: error.message });
  }
};

const getAllAccounts = async (req, res) => {
  try {
    const accounts = await CompteBancaire.findAll({ include: User });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des comptes.', error: error.message });
  }
};

const blockAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await CompteBancaire.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: 'Compte non trouvé.' });
    }
    await account.update({ statut: 'bloque' });
    res.json({ message: 'Compte bloqué.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du blocage.', error: error.message });
  }
};

const unblockAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await CompteBancaire.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: 'Compte non trouvé.' });
    }
    await account.update({ statut: 'actif' });
    res.json({ message: 'Compte débloqué.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du déblocage.', error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const userCount = await User.count();
    const accountCount = await CompteBancaire.count();
    const totalDeposits = await Transaction.sum('montant', { where: { type_transaction: 'depot' } }) || 0;
    res.json({
      nombre_clients: userCount,
      nombre_comptes: accountCount,
      somme_depots: totalDeposits,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.', error: error.message });
  }
};

module.exports = { getAllUsers, updateUser, deleteUser, getAllAccounts, blockAccount, unblockAccount, getStats };