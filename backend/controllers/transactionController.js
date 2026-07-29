// Données fictives pour les comptes bancaires (partagées avec accountController)
let comptes = [
  { id: 1, user_id: 1, numero_compte: 'FR1234567890', iban: 'FR1234567890123456789012345', solde: 5000.00, type_compte: 'courant', statut: 'actif' },
  { id: 2, user_id: 2, numero_compte: 'FR0987654321', iban: 'FR0987654321098765432109876', solde: 2500.00, type_compte: 'courant', statut: 'actif' },
  { id: 3, user_id: 3, numero_compte: 'FR1122334455', iban: 'FR1122334455112233445567890', solde: 1000.00, type_compte: 'epargne', statut: 'actif' },
  { id: 4, user_id: 1, numero_compte: 'FR9999999999', iban: 'FR9999999999999999999999999', solde: 10000.00, type_compte: 'courant', statut: 'actif' } // Compte admin
];

// Données fictives pour les transactions
let transactions = [
  {
    id: 1,
    compte_expediteur_id: 1,
    compte_destinataire_id: null,
    type_transaction: 'depot',
    montant: 1000.00,
    description: 'Dépôt initial',
    date_transaction: new Date('2024-01-15')
  },
  {
    id: 2,
    compte_expediteur_id: 2,
    compte_destinataire_id: null,
    type_transaction: 'depot',
    montant: 500.00,
    description: 'Dépôt',
    date_transaction: new Date('2024-01-20')
  },
  {
    id: 3,
    compte_expediteur_id: 1,
    compte_destinataire_id: 2,
    type_transaction: 'virement',
    montant: 200.00,
    description: 'Virement test',
    date_transaction: new Date('2024-02-01')
  },
  {
    id: 4,
    compte_expediteur_id: 3,
    compte_destinataire_id: null,
    type_transaction: 'depot',
    montant: 300.00,
    description: 'Dépôt',
    date_transaction: new Date('2024-02-10')
  }
];

const deposit = async (req, res) => {
  try {
    const { compte_id, montant } = req.body;
    if (montant < 1) {
      return res.status(400).json({ message: 'Le dépôt minimum est de 1€.' });
    }

    const account = comptes.find(c => c.id === parseInt(compte_id) && c.user_id === req.user.id);
    if (!account) {
      return res.status(404).json({ message: 'Compte non trouvé.' });
    }

    account.solde = parseFloat(account.solde) + parseFloat(montant);

    const transaction = {
      id: transactions.length + 1,
      compte_destinataire_id: parseInt(compte_id),
      type_transaction: 'depot',
      montant: parseFloat(montant),
      description: 'Dépôt',
      date_transaction: new Date()
    };
    transactions.push(transaction);

    res.json({ message: 'Dépôt effectué avec succès.', nouveau_solde: account.solde });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du dépôt.', error: error.message });
  }
};

const withdraw = async (req, res) => {
  try {
    const { compte_id, montant } = req.body;
    if (montant > 1000) {
      return res.status(400).json({ message: 'Le retrait maximum est de 1000€.' });
    }

    const account = comptes.find(c => c.id === parseInt(compte_id) && c.user_id === req.user.id);
    if (!account) {
      return res.status(404).json({ message: 'Compte non trouvé.' });
    }

    if (parseFloat(account.solde) < parseFloat(montant)) {
      return res.status(400).json({ message: 'Solde insuffisant.' });
    }

    account.solde = parseFloat(account.solde) - parseFloat(montant);

    const transaction = {
      id: transactions.length + 1,
      compte_expediteur_id: parseInt(compte_id),
      type_transaction: 'retrait',
      montant: parseFloat(montant),
      description: 'Retrait',
      date_transaction: new Date()
    };
    transactions.push(transaction);

    res.json({ message: 'Retrait effectué avec succès.', nouveau_solde: account.solde });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du retrait.', error: error.message });
  }
};

const transfer = async (req, res) => {
  try {
    const { expediteur_id, destinataire_id, montant } = req.body;

    const sender = comptes.find(c => c.id === parseInt(expediteur_id) && c.user_id === req.user.id);
    const receiver = comptes.find(c => c.id === parseInt(destinataire_id));

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'Compte(s) non trouvé(s).' });
    }
    if (parseFloat(sender.solde) < parseFloat(montant)) {
      return res.status(400).json({ message: 'Solde insuffisant.' });
    }

    sender.solde = parseFloat(sender.solde) - parseFloat(montant);
    receiver.solde = parseFloat(receiver.solde) + parseFloat(montant);

    const transaction = {
      id: transactions.length + 1,
      compte_expediteur_id: parseInt(expediteur_id),
      compte_destinataire_id: parseInt(destinataire_id),
      type_transaction: 'virement',
      montant: parseFloat(montant),
      description: 'Virement',
      date_transaction: new Date()
    };
    transactions.push(transaction);

    res.json({ message: 'Virement effectué avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du virement.', error: error.message });
  }
};

const transferByIBAN = async (req, res) => {
  try {
    const { expediteur_id, iban_destinataire, montant } = req.body;

    const sender = comptes.find(c => c.id === parseInt(expediteur_id) && c.user_id === req.user.id);
    const receiver = comptes.find(c => c.iban === iban_destinataire);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'Compte(s) non trouvé(s).' });
    }
    if (parseFloat(sender.solde) < parseFloat(montant)) {
      return res.status(400).json({ message: 'Solde insuffisant.' });
    }

    sender.solde = parseFloat(sender.solde) - parseFloat(montant);
    receiver.solde = parseFloat(receiver.solde) + parseFloat(montant);

    const transaction = {
      id: transactions.length + 1,
      compte_expediteur_id: parseInt(expediteur_id),
      compte_destinataire_id: receiver.id,
      type_transaction: 'virement',
      montant: parseFloat(montant),
      description: 'Virement par IBAN',
      date_transaction: new Date()
    };
    transactions.push(transaction);

    res.json({ message: 'Virement effectué avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du virement.', error: error.message });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const { compte_id } = req.params;
    const account = comptes.find(c => c.id === parseInt(compte_id) && c.user_id === req.user.id);

    if (!account) {
      return res.status(404).json({ message: 'Compte non trouvé.' });
    }

    const accountTransactions = transactions.filter(t =>
      t.compte_expediteur_id === parseInt(compte_id) || t.compte_destinataire_id === parseInt(compte_id)
    );

    res.json(accountTransactions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique.', error: error.message });
  }
};

const getAllUserTransactions = async (req, res) => {
  try {
    const userAccounts = comptes.filter(c => c.user_id === req.user.id);
    const accountIds = userAccounts.map(c => c.id);

    const userTransactions = transactions.filter(t =>
      accountIds.includes(t.compte_expediteur_id) || accountIds.includes(t.compte_destinataire_id)
    ).sort((a, b) => new Date(b.date_transaction) - new Date(a.date_transaction));

    res.json(userTransactions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique.', error: error.message });
  }
};

module.exports = { deposit, withdraw, transfer, transferByIBAN, getTransactionHistory, getAllUserTransactions, comptes };