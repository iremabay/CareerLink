const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { recommendFromUploadedFile } = require("../controllers/cvController");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

router.post("/upload", upload.single("cv"), recommendFromUploadedFile);

module.exports = router;
