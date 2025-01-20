require('dotenv').config()
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const multer = require('multer');   [paste them in main file] 
// const {storage} = require('./cloudconfig');
// const upload = multer({ storage });
cloudinary.config({
    cloud_name:process.env.cloudname, 
    api_key:process.env.apikey,      
    api_secret:process.env.apisecret,
});
const storage = new CloudinaryStorage({
cloudinary: cloudinary,
params: {
        folder: 'listings', 
        allowed_formats: ['jpeg', 'png', 'jpg', 'gif'], 
        transformation: [{ width: 800, height: 800, crop: 'limit' }] 
    }
});
module.exports={cloudinary,storage}
