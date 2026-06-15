'use strict';

const express = require('express');
const router = express.Router();

// TODO: Implementasi controller auth (login, register, logout, me)
// Endpoint: POST /api/auth/register | POST /api/auth/login | POST /api/auth/logout | GET /api/auth/me

router.get('/ping', (req, res) => {
  res.json({ success: true, data: { module: 'auth', status: 'router aktif' } });
});

module.exports = router;
