const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const saveJob = async (req, res) => {
  const userId = req.user.userId;
  const { jobPostingId } = req.body;

  try {
    const alreadySaved = await prisma.savedJob.findFirst({
      where: { userId, jobPostingId }
    });

    if (alreadySaved) {
      return res.status(400).json({ message: "Bu ilan zaten kaydedilmiş." });
    }

    const saved = await prisma.savedJob.create({
      data: { userId, jobPostingId }
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error("İlan kaydetme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

const getSavedJobs = async (req, res) => {
  const userId = req.user.userId;

  try {
    const saved = await prisma.savedJob.findMany({
      where: { userId },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            description: true,
            companyName: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(saved);
  } catch (error) {
    console.error("Kaydedilen ilanlar getirilemedi:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

const removeSavedJob = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const savedJob = await prisma.savedJob.findUnique({ where: { id: Number(id) } });

    if (!savedJob || savedJob.userId !== userId) {
      return res.status(403).json({ message: "Bu kaydı silmeye yetkiniz yok." });
    }

    await prisma.savedJob.delete({ where: { id: Number(id) } });

    res.json({ message: "Kayıt silindi." });
  } catch (error) {
    console.error("Kaydı silme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

module.exports = { saveJob, getSavedJobs, removeSavedJob };
