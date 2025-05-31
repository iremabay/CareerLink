const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const jobRoutes = require("./routes/jobRoutes");
app.use("/api/jobs", jobRoutes);

const applicationRoutes = require("./routes/applicationRoutes");
app.use("/api/applications", applicationRoutes);

const savedJobRoutes = require("./routes/savedJobRoutes");
app.use("/api/saved-jobs", savedJobRoutes);

const recommendationRoutes = require("./routes/recommendationRoutes");
app.use("/api", recommendationRoutes);

const cvRoutes = require("./routes/cvRoutes");
app.use("/api/cv", cvRoutes);



// Test endpoint
app.get('/', (req, res) => {
  res.send('CareerLink Backend çalışıyor 🚀');
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});
