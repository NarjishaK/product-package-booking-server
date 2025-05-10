
var express = require('express');
var router = express.Router();
const Controller = require('../controller/razorypay')

router.post('/',Controller.order)
router.post('/',Controller.validate)


module.exports = router;