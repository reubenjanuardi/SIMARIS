'use strict';
const express = require('express');
const router = express.Router();
// TODO: Implementasi CRUD inventaris
router.get('/ping', (req, res) => res.json({ success: true, data: { module: 'inventaris' } }));
module.exports = router;
