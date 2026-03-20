import express from "express";
import multer from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()
const upload = multer({ dest: path.join(__dirname, 'uploads/')}) 

app.use(express.static(path.join(__dirname, 'public')));


app.post('/upload', upload.single('testing'), (req, res, next) => {
    // req.file is the `testing` file
    /*
    file: {
        fieldname: 'testing',
        originalname: '002.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: 'uploads/',
        filename: '99c6fd3433b03c70ecd08700a49604bc',
        path: 'uploads/99c6fd3433b03c70ecd08700a49604bc',
        size: 944042
    },
    */
    // req.body will hold the text fields, if there were any
    console.dir(req)
    res.send('File uploaded.')
})

const port = 80

app.listen(port, () => {
  console.log(`Server app listening on port ${port}`)
})

