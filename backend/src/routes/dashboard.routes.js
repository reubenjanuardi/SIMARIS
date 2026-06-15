'use strict';
const express = require('express');
const router = express.Router();
// TODO: Implementasi dashboard (summary, recent-activity, barang-perlu-perhatian)
router.get('/ping', (req, res) => res.json({ success: true, data: { module: 'dashboard' } }));
module.exports = router;
