const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Données fictives pour les utilisateurs (cohérent avec les comptes fictifs)
let users = [
  {
    id: 1,
    nom: 'Admin',
    prenom: 'System',
    email: 'admin@irisbank.com',
    telephone: '0123456789',
    adresse: '123 Rue de la Banque',
    date_naissance: '1980-01-01',
    mot_de_passe: '$2a$10$2DwQlRwpatkLdXfEEE0TveNETXnuNXGsh8imQ1ksJLcAIy4OeRiZW', // 'admin123' hashé
    role: 'admin'
  },
  {
    id: 2,
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@iris.fr',
    telephone: '0123456789',
    adresse: '456 Rue des Clients',
    date_naissance: '1990-05-15',
    mot_de_passe: '$2a$10$D.KLYeTHVMUBWUnO/PeWVuhTLQN1G.31EbPqima28CSQ8sZR6cjJq', // 'password123' hashé
    role: 'client'
  },
  {
    id: 3,
    nom: 'Martin',
    prenom: 'Marie',
    email: 'marie.martin@iris.fr',
    telephone: '0987654321',
    adresse: '789 Avenue des Comptes',
    date_naissance: '1985-12-20',
    mot_de_passe: '$2a$10$D.KLYeTHVMUBWUnO/PeWVuhTLQN1G.31EbPqima28CSQ8sZR6cjJq', // 'password123' hashé
    role: 'client'
  }
];

const register = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, adresse, date_naissance, mot_de_passe } = req.body;

    // Validation de l'email - accepter seulement @iris.fr
    if (!validator.isEmail(email) || !email.toLowerCase().endsWith('@iris.fr')) {
      return res.status(400).json({ message: 'Seuls les emails @iris.fr sont acceptés.' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé.' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Créer l'utilisateur
    const newUser = {
      id: users.length + 1,
      nom,
      prenom,
      email,
      telephone,
      adresse,
      date_naissance,
      mot_de_passe: hashedPassword,
      role: 'client'
    };

    users.push(newUser);

    res.status(201).json({ message: 'Utilisateur créé avec succès.', user: { id: newUser.id, email: newUser.email } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription.', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // Connexion admin temporaire pour les tests
    if (email === 'admin@irisbank.com' && mot_de_passe === 'admin123') {
      req.loginSuccess(); // Marquer comme succès
      const token = jwt.sign({ id: 1, email: 'admin@irisbank.com', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.json({
        message: 'Connexion réussie.',
        token,
        user: { id: 1, nom: 'Admin', prenom: 'System', email: 'admin@irisbank.com', role: 'admin' }
      });
    }

    // Trouver l'utilisateur dans les données fictives
    const user = users.find(u => u.email === email);
    if (!user) {
      req.loginFailed(); // Marquer comme échec
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch) {
      req.loginFailed(); // Marquer comme échec
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    req.loginSuccess(); // Marquer comme succès

    // Générer le token JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Connexion réussie.', token, user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role } });
  } catch (error) {
    req.loginFailed(); // Marquer comme échec en cas d'erreur
    res.status(500).json({ message: 'Erreur lors de la connexion.', error: error.message });
  }
};

module.exports = { register, login };