'use strict';
const express = require('express');
const router = express.Router();
// TODO: Implementasi modul maintenance
router.get('/ping', (req, res) => res.json({ success: true, data: { module: 'maintenance' } }));
module.exports = router;
