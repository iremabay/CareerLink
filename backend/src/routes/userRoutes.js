const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware"); //JWT kontrolü

// Kayıt (register)
router.post("/register", registerUser);

// Giriş (login)
router.post("/login", loginUser);
// Kullanıcı bilgileri getirme
router.get("/profile", verifyToken, getUserProfile);

// Giriş yapmış kullanıcı için test route (korumalı)
router.get("/me", verifyToken, (req, res) => {
  res.json({
    message: "Korunan route'a hoş geldin!",
    userId: req.user.userId,
    role: req.user.role,
  });
});

module.exports = router;
