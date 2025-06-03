const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });


const createApplication = async (req, res) => {
  const user = req.user;
  const jobPostingId = req.body?.jobPostingId;

  console.log("BAŞVURU İSTEK:", { userId: user?.userId, jobPostingId });

  if (!jobPostingId) {
    return res.status(400).json({ message: "jobPostingId zorunludur." });
  }

  if (user.role !== "USER") {
    return res.status(403).json({ message: "Sadece kullanıcılar başvuru yapabilir." });
  }

  try {
    // Daha önce bu ilana başvurmuş mu kontrol et
    const existing = await prisma.application.findFirst({
      where: {
        userId: user.userId,
        jobPostingId: parseInt(jobPostingId)
      }
    });

    if (existing) {
      return res.status(400).json({ message: "Bu ilana zaten başvurdunuz." });
    }

    // Kullanıcının veritabanındaki son yüklediği CV yolunu çek
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId }
    });

    const cvPath = currentUser?.lastCvPath || null;

    if (!cvPath) {
      return res.status(400).json({ message: "CV bulunamadı. Lütfen önce CV yükleyin." });
    }

    // Başvuru oluştur
    const application = await prisma.application.create({
      data: {
        userId: user.userId,
        jobPostingId: parseInt(jobPostingId),
        cvPath: cvPath
      }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error("Başvuru hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};




const deleteApplication = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const application = await prisma.application.findUnique({
      where: { id: Number(id) }
    });

    if (!application) {
      return res.status(404).json({ message: "Başvuru bulunamadı." });
    }

    if (application.userId !== user.userId || user.role !== "USER") {
      return res.status(403).json({ message: "Bu başvuruyu yalnızca sahibi silebilir." });
    }

    await prisma.application.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Başvuru silindi." });
  } catch (error) {
    console.error("Başvuru silme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

const updateApplication = async (req, res) => {
  const { id } = req.params;
  const { jobPostingId } = req.body;
  const user = req.user;

  try {
    const application = await prisma.application.findUnique({
      where: { id: Number(id) }
    });

    if (!application) {
      return res.status(404).json({ message: "Başvuru bulunamadı." });
    }

    if (application.userId !== user.userId || user.role !== "USER") {
      return res.status(403).json({ message: "Bu başvuruyu yalnızca sahibi güncelleyebilir." });
    }

    const updated = await prisma.application.update({
      where: { id: Number(id) },
      data: { jobPostingId }
    });

    res.json(updated);
  } catch (error) {
    console.error("Başvuru güncelleme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

const getUserApplications = async (req, res) => {
  const user = req.user;

  try {
    const applications = await prisma.application.findMany({
      where: { userId: user.userId },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            companyName: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(applications);
  } catch (error) {
    console.error("Başvuruları getirirken hata:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};


const getReceivedApplications = async (req, res) => {
  const user = req.user;

  if (user.role !== "EMPLOYER") {
    return res.status(403).json({ message: "Sadece işverenler başvuru görüntüleyebilir." });
  }

  try {
    const applications = await prisma.application.findMany({
      where: {
        jobPosting: {
          employerId: user.userId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const baseUrl = "http://localhost:3000";

    // Başvuruya cvUrl ekleme
    const updatedApplications = applications.map(app => ({
      ...app,
      cvUrl: app.cvPath ? `${baseUrl}/${app.cvPath}` : null
    }));

    res.json(updatedApplications);
  } catch (error) {
    console.error("İşveren başvuruları listelerken hata:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};


module.exports = {
  createApplication,
  getUserApplications,
  getReceivedApplications,
  deleteApplication,
  updateApplication,
  upload
};
