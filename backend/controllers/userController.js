const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['mot_de_passe'] } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil.', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse, date_naissance } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    await user.update({ nom, prenom, telephone, adresse, date_naissance });
    res.json({ message: 'Profil mis à jour avec succès.', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await bcrypt.compare(oldPassword, user.mot_de_passe);
    if (!isMatch) {
      return res.status(400).json({ message: 'Ancien mot de passe incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ mot_de_passe: hashedPassword });
    res.json({ message: 'Mot de passe changé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe.', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };