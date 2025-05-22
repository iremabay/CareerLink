const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

//
//  KULLANICI KAYIT (REGISTER)
//
const registerUser = async (req, res) => {
  const { fullName, email, password, role } = req.body;

  try {
    console.log("🟡 Register isteği geldi:", req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      console.log("🔴 Bu e-posta zaten kayıtlı:", email);
      return res.status(400).json({ message: "Bu e-posta zaten kayıtlı." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
      },
    });

    console.log("🟢 Yeni kullanıcı oluşturuldu:", newUser.email);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("🔥 Kayıt hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};


//
// KULLANICI GİRİŞ (LOGIN)
//
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("🟡 Login isteği geldi:", email);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("🔴 Kullanıcı bulunamadı:", email);
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    console.log("📦 Veritabanındaki kullanıcı:", user);

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      console.log("🔴 Şifre eşleşmedi");
      return res.status(400).json({ message: "Hatalı şifre." });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("🟢 Giriş başarılı, token oluşturuldu.");
    res.json({ token });
  } catch (error) {
    console.error("🔥 Giriş hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

module.exports = { registerUser, loginUser };
