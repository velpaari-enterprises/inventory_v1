const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dpebzsbtj",
  api_key: process.env.CLOUDINARY_API_KEY || "317852785236772",
  api_secret: process.env.CLOUDINARY_API_SECRET || "GQO2xD1SO-hYiJjzl54CPPK_lTQ"
});

// Test connection
cloudinary.api.ping()
  .then(result => console.log('Connected to Cloudinary:', result))
  .catch(error => console.error('Connection failed:', error));

module.exports = cloudinary;
