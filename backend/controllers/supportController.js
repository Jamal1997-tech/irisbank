const SupportTicket = require('../models/SupportTicket');
const ContactMessage = require('../models/ContactMessage');

// Tickets de support
const getAllTickets = async (req, res) => {
  try {
    // Données fictives pour les tests
    const tickets = [
      {
        id: 1,
        sujet: 'Problème de connexion',
        description: 'Je n\'arrive pas à me connecter à mon compte',
        priorite: 'haute',
        statut: 'ouvert',
        date_creation: new Date(),
        client: { nom: 'Dupont', prenom: 'Jean' }
      },
      {
        id: 2,
        sujet: 'Virement non reçu',
        description: 'Le virement que j\'ai envoyé n\'est pas arrivé',
        priorite: 'moyenne',
        statut: 'en_cours',
        date_creation: new Date(),
        client: { nom: 'Martin', prenom: 'Marie' }
      }
    ];
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tickets.', error: error.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findByPk(id, {
      include: [
        { model: require('../models/User'), as: 'client' },
        { model: require('../models/SupportResponse'), as: 'responses', include: [{ model: require('../models/User'), as: 'admin' }] }
      ]
    });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé.' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du ticket.', error: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const { sujet, description, priorite = 'moyenne' } = req.body;
    const ticket = await SupportTicket.create({
      client_id: req.user.id,
      sujet,
      description,
      priorite,
      statut: 'ouvert'
    });
    res.status(201).json({ message: 'Ticket créé avec succès.', ticket });
  } catch (error) {
    console.error('Erreur de création du ticket de support :', error);
    res.status(500).json({ message: 'Erreur lors de la création du ticket.', error: error.message });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé.' });
    }
    await ticket.update({ statut });
    res.json({ message: 'Statut du ticket mis à jour.', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du ticket.', error: error.message });
  }
};

const addTicketResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé.' });
    }

    const SupportResponse = require('../models/SupportResponse');
    const response = await SupportResponse.create({
      ticket_id: id,
      admin_id: req.user.id,
      message
    });

    res.status(201).json({ message: 'Réponse ajoutée.', response });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout de la réponse.', error: error.message });
  }
};

// Messages de contact
const getAllContacts = async (req, res) => {
  try {
    const contacts = await ContactMessage.findAll({
      order: [['date_creation', 'DESC']]
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des messages.', error: error.message });
  }
};

const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await ContactMessage.findByPk(id);
    if (!contact) {
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du message.', error: error.message });
  }
};

const createContact = async (req, res) => {
  try {
    const { nom, email, sujet, message } = req.body;
    const contact = await ContactMessage.create({
      nom,
      email,
      sujet,
      message
    });
    res.status(201).json({ message: 'Message envoyé avec succès.', contact });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message.', error: error.message });
  }
};

const markContactAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await ContactMessage.findByPk(id);
    if (!contact) {
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    await contact.update({ lu: true });
    res.json({ message: 'Message marqué comme lu.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour.', error: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await ContactMessage.findByPk(id);
    if (!contact) {
      return res.status(404).json({ message: 'Message non trouvé.' });
    }
    await contact.destroy();
    res.json({ message: 'Message supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression.', error: error.message });
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  addTicketResponse,
  getAllContacts,
  getContactById,
  createContact,
  markContactAsRead,
  deleteContact
};