const express = require('express');
const router = express.Router();
const {rHandler} = require('../controllers/home')

// POST /api/wiki/fetch
router.get('/:something',rHandler); 

module.exports = router;
