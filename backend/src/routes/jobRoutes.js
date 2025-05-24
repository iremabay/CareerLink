const express = require("express");
const router = express.Router();
const { createJob, getAllJobs, updateJob, deleteJob,getMyJobs } = require("../controllers/jobController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/", verifyToken, createJob); // korumalı ilan ekleme
router.get("/", getAllJobs);

router.put("/:id", verifyToken, updateJob);      
router.delete("/:id", verifyToken, deleteJob); 

router.get("/my", verifyToken, getMyJobs); 

module.exports = router;
