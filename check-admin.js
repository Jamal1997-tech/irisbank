const { sequelize, connectDB } = require('./backend/config/database');
const User = require('./backend/models/User');
const bcrypt = require('bcrypt');

async function checkAndCreateAdmin() {
  try {
    await connectDB();
    console.log('Connexion à la base de données établie.');

    // Vérifier s'il y a des utilisateurs
    const users = await User.findAll();
    console.log(`Nombre d'utilisateurs trouvés: ${users.length}`);

    if (users.length === 0) {
      console.log('Aucun utilisateur trouvé. Création d\'un utilisateur admin...');

      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = await User.create({
        nom: 'Admin',
        prenom: 'System',
        email: 'admin@irisbank.com',
        mot_de_passe: hashedPassword,
        role: 'admin',
        date_creation: new Date()
      });

      console.log('Utilisateur admin créé:', adminUser.toJSON());
    } else {
      console.log('Utilisateurs existants:');
      users.forEach(user => {
        console.log(`- ${user.nom} ${user.prenom} (${user.email}) - Rôle: ${user.role}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkAndCreateAdmin();