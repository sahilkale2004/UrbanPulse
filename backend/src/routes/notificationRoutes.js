const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.route('/')
  .get(getNotifications);

router.route('/:id/read')
  .put(markAsRead);

module.exports = router;
