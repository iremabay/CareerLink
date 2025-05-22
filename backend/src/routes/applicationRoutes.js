const express = require("express");
const router = express.Router();
const { createApplication, getUserApplications, getReceivedApplications, deleteApplication, updateApplication } = require("../controllers/applicationController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", verifyToken, createApplication);
router.get("/", verifyToken, getUserApplications);
router.get("/received", verifyToken, getReceivedApplications);
router.delete("/:id", verifyToken, deleteApplication);
router.put("/:id", verifyToken, updateApplication);
module.exports = router;
