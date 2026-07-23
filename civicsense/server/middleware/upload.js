const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const getStorage = (subDir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads', subDir || 'general');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  /\.(jpeg|jpg|png|gif|webp)$/i.test(file.originalname) ? cb(null, true) : cb(new Error('Images only'), false);
};

const createUpload = (subDir) => multer({
  storage: getStorage(subDir),
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
});

module.exports = createUpload;
