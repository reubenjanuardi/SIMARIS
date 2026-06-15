'use strict';
const express = require('express');
const router = express.Router();
// TODO: Implementasi modul penghapusan aset
router.get('/ping', (req, res) => res.json({ success: true, data: { module: 'penghapusan' } }));
module.exports = router;
