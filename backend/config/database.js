const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'iris_bank',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    // Options pour gérer les connexions
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Options pour les erreurs de connexion
    retry: {
      max: 3
    }
  }
);

// Tester la connexion
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données réussie.');
  } catch (error) {
    console.error('Erreur de connexion à la base de données:', error);
    console.log('Tentative de connexion avec SQLite en fallback...');

    // Fallback vers SQLite si MySQL échoue
    try {
      const sqliteSequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
      });
      await sqliteSequelize.authenticate();
      console.log('Connexion SQLite réussie (fallback).');
      // Remplacer sequelize par sqliteSequelize
      global.sequelize = sqliteSequelize;
    } catch (sqliteError) {
      console.error('Erreur de connexion SQLite:', sqliteError);
    }
  }
};

module.exports = { sequelize, connectDB };