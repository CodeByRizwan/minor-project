const express = require('express');
const router = express.Router();
const { editsHandler, wordCloudHandler, topEditorsHandler, timelineHandler } = require('../controllers/home');

router.get('/edits', editsHandler);
router.get('/wordcloud', wordCloudHandler);
router.get('/topeditors', topEditorsHandler);
router.get('/timeline', timelineHandler);

router.get('/', (req, res) => {
    res.render('home');
});

module.exports = router;
