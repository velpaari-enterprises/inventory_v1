const express = require('express');
const router = express.Router();
const productMasterController = require('../controllers/productMasterController');
const multer = require('multer');

// Configure multer for Excel uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /xlsx|xls/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (filetypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'), false);
    }
  }
});

// Upload Excel file (creates categories and combos automatically)
router.post('/upload', 
  upload.single('file'),
  productMasterController.uploadExcel
);

module.exports = router;
