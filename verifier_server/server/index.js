// server/index.js

const PORT = process.env.SERVER_PORT || 3001;
const express = require("express");
const app = express();
app.use(express.json({ limit: '1mb' }));

const functions = require("firebase-functions");

const cors = require('cors');
// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

const { verifyProof } = require('./verify_proof')

app.post("/api/verify_proof", (req, res) => {
  verifyProof(req, res).then((response) => {
    if (response) {
      res.json(response);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// Expose Express API as a single Cloud Function:
exports.backend_apis = functions
  .runWith({
    // Ensure the function has enough memory and time
    // to process large files
    timeoutSeconds: 540,
    memory: "2GB",
  })
  .https.onRequest(app);