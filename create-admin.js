const bcrypt = require('bcrypt');

// Créer un utilisateur admin pour les tests
const createAdminUser = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = {
    id: Date.now(), // ID simple pour les tests
    nom: 'Admin',
    prenom: 'System',
    email: 'admin@irisbank.com',
    mot_de_passe: hashedPassword,
    role: 'admin',
    date_creation: new Date()
  };

  console.log('Utilisateur admin créé:');
  console.log('Email: admin@irisbank.com');
  console.log('Mot de passe: admin123');
  console.log('Rôle: admin');
  console.log('Token à utiliser pour les tests:', 'admin-token-123'); // Token fictif pour les tests

  return adminUser;
};

createAdminUser().then(() => process.exit(0));