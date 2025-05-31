const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Dosya yükleme ayarları (temp klasörüne)
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

const getRecommendations = async (req, res) => {
  try {
    const filePath = req.file.path;
    const text = fs.readFileSync(filePath, "utf-8");

    const response = await axios.post("http://localhost:8000/recommend", {
      cv_text: text,
    });

    fs.unlinkSync(filePath); // Dosyayı sildik

    res.json(response.data);
  } catch (error) {
    console.error("Öneri hatası:", error);
    res.status(500).json({ message: "Öneri alınamadı" });
  }
};

module.exports = { upload, getRecommendations };
