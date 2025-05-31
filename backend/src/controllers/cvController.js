const axios = require("axios");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const recommendFromUploadedFile = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "Dosya yüklenmedi." });
  }

  try {
    const ext = path.extname(file.originalname).toLowerCase();
    let text = "";

    if (ext === ".txt") {
      text = fs.readFileSync(file.path, "utf-8");
    } else if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(file.path);
      const parsed = await pdfParse(dataBuffer);
      text = parsed.text;
    } else {
      fs.unlinkSync(file.path); // desteklenmeyen dosya ise sil
      return res.status(400).json({ message: "Yalnızca .pdf ve .txt dosyalar desteklenir." });
    }

    // Dosyayı yükledikten sonra silelim
    fs.unlinkSync(file.path);

    // Öneri sistemine gönder
    const response = await axios.post("http://localhost:8000/recommend", {
      cv_text: text,
    });

    const recommendations = response.data;

    res.json({
      message: "CV yüklendi ve öneriler başarıyla oluşturuldu.",
      recommendations,
    });
  } catch (error) {
    console.error("CV öneri hatası:", error.message);
    res.status(500).json({ message: "CV'den öneri alınamadı." });
  }
};

module.exports = { recommendFromUploadedFile };
