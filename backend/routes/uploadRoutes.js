const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');

const router = express.Router();

const storage = multer.memoryStorage();

const imageFileFilter = (_, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const getGridFSBucket = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise();
  }

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'fs',
  });
};

const getSafeFilename = (file) => {
  const safeName = String(file.originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safeName}`;
};

router.post('/images', (req, res) => {
  upload.array('images', 12)(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    try {
      const files = req.files || [];

      if (files.length === 0) {
        return res.status(400).json({ message: 'No image files provided' });
      }

      getGridFSBucket()
        .then(async (bucket) => {
          const storedFiles = await Promise.all(
            files.map(
              (file) =>
                new Promise((resolve, reject) => {
                  const filename = getSafeFilename(file);
                  const uploadStream = bucket.openUploadStream(filename, {
                    metadata: {
                      originalName: file.originalname,
                      contentType: file.mimetype,
                    },
                  });

                  uploadStream.on('error', reject);
                  uploadStream.on('finish', () => {
                    const fileId = uploadStream.id.toString();
                    resolve(`/api/uploads/images/${fileId}`);
                  });

                  uploadStream.end(file.buffer);
                })
            )
          );

          return res.status(201).json({ data: storedFiles });
        })
        .catch((innerError) => {
          return res.status(500).json({ message: innerError.message });
        });
    } catch (innerError) {
      return res.status(500).json({ message: innerError.message });
    }
  });
});

router.get('/images/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid image id' });
    }

    const bucket = await getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    const files = await bucket.find({ _id: objectId }).toArray();
    const file = files[0];

    if (!file) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.set('Content-Type', file.metadata?.contentType || 'application/octet-stream');
    if (typeof file.length === 'number') {
      res.set('Content-Length', String(file.length));
    }

    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.on('error', (streamError) => {
      if (!res.headersSent) {
        res.status(500).json({ message: streamError.message });
      } else {
        res.destroy(streamError);
      }
    });

    return downloadStream.pipe(res);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;