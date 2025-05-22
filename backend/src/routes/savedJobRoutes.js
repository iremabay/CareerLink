const express = require("express");
const router = express.Router();
const { saveJob, getSavedJobs, removeSavedJob } = require("../controllers/savedJobController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", verifyToken, saveJob);
router.get("/", verifyToken, getSavedJobs);
router.delete("/:id", verifyToken, removeSavedJob);

module.exports = router;
