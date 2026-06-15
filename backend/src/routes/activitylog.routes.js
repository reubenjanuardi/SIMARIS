'use strict';
const express = require('express');
const router = express.Router();
// TODO: Implementasi activity log (GET list + export CSV/PDF)
router.get('/ping', (req, res) => res.json({ success: true, data: { module: 'activitylog' } }));
module.exports = router;
