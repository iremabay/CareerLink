const express = require("express");
const router = express.Router();

const {
  createApplication,
  getUserApplications,
  getReceivedApplications,
  deleteApplication,
  updateApplication
} = require("../controllers/applicationController");

const { upload } = require("../controllers/applicationController");
const authenticate = require("../middleware/authMiddleware"); 
// Başvuru yaparken CV yüklenebilir
router.post("/", authenticate, upload.single("cv"), createApplication);

// Kullanıcının kendi başvurularını görmesi
router.get("/", authenticate, getUserApplications);

// İşverenin aldığı başvuruları görmesi
router.get("/received", authenticate, getReceivedApplications);

// Başvuru silme
router.delete("/:id", authenticate, deleteApplication);

// Başvuru güncelleme
router.put("/:id", authenticate, updateApplication);

module.exports = router;
