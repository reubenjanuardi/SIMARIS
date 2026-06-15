'use strict';

const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const { User }    = require('../models');
const { logActivity } = require('../utils/activityLogger');

// =============================================================
// REGISTER
// Hanya bisa dipanggil oleh admin (enforce di routes).
// =============================================================
async function register(req, res) {
  try {
    const { username, password, nama, email, role, departemen } = req.body;

    // --- Validasi field wajib ---
    if (!username || !password || !nama || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Field username, password, nama, email, dan role wajib diisi.',
      });
    }

    // --- Cek apakah username sudah dipakai ---
    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'Username sudah digunakan. Pilih username yang lain.',
      });
    }

    // --- Validasi nilai ENUM role ---
    const validRoles = ['admin', 'staff', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role tidak valid. Pilihan yang tersedia: ${validRoles.join(', ')}.`,
      });
    }

    // --- Hash password sebelum disimpan ke database ---
    // saltRounds: 10 → nilai standar yang balance antara keamanan dan performa
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Buat user baru di database ---
    const userBaru = await User.create({
      username,
      password: hashedPassword,
      nama,
      email,
      role,
      departemen: departemen || null,
    });

    // --- Catat aktivitas pembuatan user ---
    // plan.md tidak mendefinisikan tipe USER_CREATE, maka gunakan LOGIN sebagai
    // tipe terdekat yang valid untuk aksi yang berkaitan dengan tabel users.
    await logActivity({
      userId:             req.user.id, // Admin yang melakukan register
      tipeAktivitas:      'LOGIN',     // Tipe terdekat yang valid dari plan.md untuk aksi di tabel users
      tabelTarget:        'users',
      idTarget:           userBaru.id,
      nilaiLama:          null,
      nilaiBaru:          { username: userBaru.username, role: userBaru.role, nama: userBaru.nama },
      deskripsiPerubahan: `Admin ${req.user.username} mendaftarkan user baru: ${username} (role: ${role}).`,
      req,
    });

    // toJSON() pada model User otomatis menghapus field password dari response
    return res.status(201).json({
      success: true,
      data: userBaru,
    });

  } catch (error) {
    // Teruskan ke global error handler di app.js
    return res.status(500).json({
      success: false,
      message: 'Gagal mendaftarkan user. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// LOGIN
// Endpoint publik — tidak butuh token.
// =============================================================
async function login(req, res) {
  try {
    const { username, password } = req.body;

    // --- Validasi input wajib ---
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.',
      });
    }

    // --- Cari user berdasarkan username ---
    // Sengaja gunakan pesan generik agar tidak membocorkan info
    // (apakah username salah atau password yang salah)
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    // --- Bandingkan password dengan hash di database ---
    // bcrypt.compare() aman terhadap timing attack
    const passwordCocok = await bcrypt.compare(password, user.password);
    if (!passwordCocok) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    // --- Generate JWT token ---
    // Payload hanya berisi data minimal yang dibutuhkan middleware auth
    const payload = {
      id:       user.id,
      username: user.username,
      nama:     user.nama,
      role:     user.role,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // --- Catat aktivitas login ke activity_log ---
    await logActivity({
      userId:              user.id,
      tipeAktivitas:       'LOGIN',
      tabelTarget:         'users',
      idTarget:            user.id,
      nilaiLama:           null,
      nilaiBaru:           { username: user.username, role: user.role },
      deskripsiPerubahan:  `${user.nama} berhasil login ke sistem.`,
      req,
    });

    // --- Kirim response dengan token dan data user (tanpa password) ---
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id:         user.id,
          username:   user.username,
          nama:       user.nama,
          role:       user.role,
          departemen: user.departemen,
        },
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan login. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// LOGOUT
// JWT bersifat stateless — server tidak menyimpan session.
// Tugas client: hapus token dari localStorage/cookie.
// Tugas server: catat aktivitas logout saja.
// =============================================================
async function logout(req, res) {
  try {
    // req.user sudah diisi oleh middleware authenticate sebelum sampai sini
    await logActivity({
      userId:             req.user.id,
      tipeAktivitas:      'LOGOUT',
      tabelTarget:        'users',
      idTarget:           req.user.id,
      nilaiLama:          null,
      nilaiBaru:          null,
      deskripsiPerubahan: `${req.user.nama} logout dari sistem.`,
      req,
    });

    return res.status(200).json({
      success: true,
      message: 'Berhasil logout. Silakan hapus token di sisi client.',
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan logout. Silakan coba beberapa saat lagi.',
    });
  }
}

// =============================================================
// GET ME
// Mengembalikan profil user yang sedang login.
// Data diambil dari payload JWT yang sudah diverifikasi middleware.
// =============================================================
async function getMe(req, res) {
  try {
    // Ambil data fresh dari DB agar data terkini (bukan hanya dari token payload)
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    // toJSON() otomatis exclude password (didefinisikan di model User.js)
    return res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil. Silakan coba beberapa saat lagi.',
    });
  }
}

module.exports = { register, login, logout, getMe };
