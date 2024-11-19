import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

const fileUploader=async(localFilePath)=>{
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });
    //File Upload
    try {
        if(!localFilePath) return null
        const fileInstance= await cloudinary.uploader.upload(localFilePath,{resource_type: 'auto'})
        // console.log(`File Uploaded Successfully!, url: ${fileInstance.url}`)
        fs.unlinkSync(localFilePath)
        return fileInstance;       
    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.log(error)
    }
}

export default fileUploader;

