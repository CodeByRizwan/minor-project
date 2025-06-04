const express = require('express');
const router = express.Router();
const { editsHandler, wordCloudHandler, topEditorsHandler, timelineHandler } = require('../controllers/home');
router.get('/edits', editsHandler);
router.get('/wordcloud', wordCloudHandler);
router.get('/topeditors', topEditorsHandler);
router.get('/timeline', timelineHandler);
function isAuthe(req) {
  return !!req.user;
}
function ensureAuthenticated(req, res, next) {
  if (isAuthe(req)) {
    return next();
  }
  res.redirect('/login');
}
router.get('/', ensureAuthenticated, (req, res) => {
    res.render('home', { user: req.user });
});
module.exports = router;
