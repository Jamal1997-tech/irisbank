// Importer les données fictives depuis transactionController
const { comptes } = require('./transactionController');

const createAccount = async (req, res) => {
  try {
    const { type_compte } = req.body;
    const iban = 'FR' + Math.random().toString().substr(2, 23); // Génération simple d'IBAN

    const account = {
      id: comptes.length + 1,
      user_id: req.user.id,
      iban,
      type_compte,
      solde: 0.00,
      statut: 'actif'
    };

    comptes.push(account);

    res.status(201).json({ message: 'Compte créé avec succès.', account });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du compte.', error: error.message });
  }
};

const getAccounts = async (req, res) => {
  try {
    const userAccounts = comptes.filter(c => c.user_id === req.user.id);
    res.json(userAccounts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des comptes.', error: error.message });
  }
};

const getAccountDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const account = comptes.find(c => c.id === parseInt(id) && c.user_id === req.user.id);
    if (!account) {
      return res.status(404).json({ message: 'Compte non trouvé.' });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du compte.', error: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const accountIndex = comptes.findIndex(c => c.id === parseInt(id) && c.user_id === req.user.id);
    if (accountIndex === -1) {
      return res.status(404).json({ message: 'Compte non trouvé.' });
    }
    if (comptes[accountIndex].solde > 0) {
      return res.status(400).json({ message: 'Impossible de supprimer un compte avec un solde positif.' });
    }

    comptes.splice(accountIndex, 1);
    res.json({ message: 'Compte supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du compte.', error: error.message });
  }
};

module.exports = { createAccount, getAccounts, getAccountDetails, deleteAccount };