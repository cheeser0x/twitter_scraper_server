const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getDataAndWriteFile } = require('./fetchData');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for all routes
app.use(cors({
  origin: 'https://twitter-scraper-frontend2.onrender.com/'
}));

// Increase the payload size limit
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.post('/get-data', async (req, res) => {
  const { tweetId } = req.body;
  try {
    const cleanedData = await getDataAndWriteFile(tweetId);
    console.log('Cleaned data received from getDataAndWriteFile:', cleanedData);
    res.json({ cleanedData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
