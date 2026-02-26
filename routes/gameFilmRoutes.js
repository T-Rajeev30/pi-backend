const router = require('express').Router()
const ctrl = require('../controllers/gameFilmController')

router.get('/', ctrl.getFilms)

module.exports = router
