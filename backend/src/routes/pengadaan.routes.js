'use strict';
const express = require('express');
const router = express.Router();
// TODO: Implementasi modul pengadaan
router.get('/ping', (req, res) => res.json({ success: true, data: { module: 'pengadaan' } }));
module.exports = router;
