const express = require("express");
const router = express.Router();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET
  }
});

router.post("/presign", async (req, res) => {
  const { filename, contentType } = req.body;

  const key = `uploads/${Date.now()}_${crypto.randomUUID()}_${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 600 });

  const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

  res.json({ signedUrl, key, publicUrl });
});

module.exports = router;
