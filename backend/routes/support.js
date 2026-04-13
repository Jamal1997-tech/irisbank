const express = require('express');
const {
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
} = require('../controllers/supportController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Routes pour les tickets de support
router.get('/tickets', authMiddleware, adminMiddleware, getAllTickets);
router.get('/tickets/:id', authMiddleware, adminMiddleware, getTicketById);
router.post('/tickets', authMiddleware, createTicket);
router.put('/tickets/:id/status', authMiddleware, adminMiddleware, updateTicketStatus);
router.post('/tickets/:id/response', authMiddleware, adminMiddleware, addTicketResponse);

// Routes pour les messages de contact
router.get('/contacts', authMiddleware, adminMiddleware, getAllContacts);
router.get('/contacts/:id', authMiddleware, adminMiddleware, getContactById);
router.post('/contacts', createContact); // Route publique pour les messages de contact
router.put('/contacts/:id/read', authMiddleware, adminMiddleware, markContactAsRead);
router.delete('/contacts/:id', authMiddleware, adminMiddleware, deleteContact);

module.exports = router;