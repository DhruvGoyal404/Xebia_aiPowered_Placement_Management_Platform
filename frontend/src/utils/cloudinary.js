const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// True only when all three credentials are present.
const isCloudinaryConfigured = () =>
  !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

const uploadBufferToCloudinary = (buffer, folder = 'placeiq/profile-pics') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

// Accepts a base64 data URL, uploads it, returns the secure URL.
const uploadProfilePic = async (dataUrl) => {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const result = await uploadBufferToCloudinary(buffer);
  return result.secure_url;
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  uploadProfilePic,
};

