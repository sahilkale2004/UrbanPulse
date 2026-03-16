const express = require('express');
const { createIssue, getIssues, getIssue, updateIssue } = require('../controllers/issueController');
const { protect, authorize, optionalAuth } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, authorize('citizen'), upload.array('images', 5), createIssue)
  .get(optionalAuth, getIssues);

router.route('/:id')
  .get(optionalAuth, getIssue)
  .put(protect, authorize('authority'), upload.array('images', 5), updateIssue);

module.exports = router;
