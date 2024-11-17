import multer from "multer"

//Disc Storage Instead of Memory Storage (Memory stores as Buffer instead of file itself)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
export default upload = multer({ storage: storage })