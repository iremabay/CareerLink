const express = require("express");
const router = express.Router();
const { upload, getRecommendations } = require("../controllers/recommendationController");

router.post("/recommend", upload.single("cv"), getRecommendations);

module.exports = router;
