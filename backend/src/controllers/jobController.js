const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const axios = require("axios");

const createJob = async (req, res) => {
  const user = req.user;
  const { title, description, companyName } = req.body;

  if (user.role !== "EMPLOYER") {
    return res.status(403).json({ message: "Sadece işverenler ilan oluşturabilir." });
  }

  try {
    // Önişleme için Python servisine istekte bulun
    const preRes = await axios.post("http://localhost:8000/preprocess", {
      cv_text: description
    });

    const processedText = preRes.data.processed_text;

    // İlanı veritabanına kaydet
    const newJob = await prisma.jobPosting.create({
      data: {
        title,
        description,
        companyName,
        employerId: user.userId,
        processed_text: processedText 
      }
    });

    res.status(201).json(newJob);
  } catch (error) {
    console.error("İlan ekleme hatası:", error);
    res.status(500).json({ message: "İlan eklenemedi" });
  }
};


const getAllJobs = async (req, res) => {
  try {
    const jobs = await prisma.jobPosting.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        employer: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json(jobs);
  } catch (error) {
    console.error("İlanları getirirken hata:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

const updateJob = async (req, res) => {
  const { id } = req.params;
  const { title, description, companyName } = req.body;
  const user = req.user;

  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: Number(id) } });

    if (!job) {
      return res.status(404).json({ message: "İlan bulunamadı." });
    }

    if (job.employerId !== user.userId || user.role !== "EMPLOYER") {
      return res.status(403).json({ message: "Bu ilana sadece sahibi erişebilir." });
    }

    const updatedJob = await prisma.jobPosting.update({
      where: { id: Number(id) },
      data: { title, description, companyName }
    });

    res.json(updatedJob);
  } catch (error) {
    console.error("İlan güncelleme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

const deleteJob = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: Number(id) } });

    if (!job) {
      return res.status(404).json({ message: "İlan bulunamadı." });
    }

    if (job.employerId !== user.userId || user.role !== "EMPLOYER") {
      return res.status(403).json({ message: "Bu ilana sadece sahibi erişebilir." });
    }

    await prisma.jobPosting.delete({ where: { id: Number(id) } });
    res.json({ message: "İlan başarıyla silindi." });
  } catch (error) {
    console.error("İlan silme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

const getMyJobs = async (req, res) => {
  const user = req.user;

  if (user.role !== "EMPLOYER") {
    return res.status(403).json({ message: "Sadece işverenler kendi ilanlarını görüntüleyebilir." });
  }

  try {
    const jobs = await prisma.jobPosting.findMany({
      where: {
        employerId: user.userId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(jobs);
  } catch (error) {
    console.error("Kendi ilanlarını getirirken hata:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};


module.exports = {
  createJob,
  getAllJobs,
  updateJob,
  deleteJob,
  getMyJobs
};

