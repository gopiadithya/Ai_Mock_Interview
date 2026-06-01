const express = require('express');
const router = express.Router();
const multer = require('multer');
const interviewController = require('../controllers/interviewController');

// Configure multer for memory storage (buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Route to setup a new interview (upload resume/JD)
router.post('/setup', upload.single('resumeFile'), interviewController.setupInterview);

// Route to start the interview (returns first question)
router.post('/:id/start', interviewController.startInterview);

// Route to send a message and get next question
router.post('/:id/chat', interviewController.chat);

// Route to end and evaluate the interview
router.post('/:id/evaluate', interviewController.evaluateInterview);

module.exports = router;
