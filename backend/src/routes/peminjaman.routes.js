'use strict';
const express = require('express');
const router = express.Router();
// TODO: Implementasi modul peminjaman
router.get('/ping', (req, res) => res.json({ success: true, data: { module: 'peminjaman' } }));
module.exports = router;
