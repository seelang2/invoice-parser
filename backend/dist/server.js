import express from "express";
import multer from "multer";
const app = express();
const upload = multer({ dest: 'uploads/' }); // ./uploads is based on dir that server was launched from
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title></title>
                <style type="text/css">
                body {
                    background: #242020;
                    color: #fff;
                    font-size: 16px;
                    font-family: Verdana;
                }
                </style>
            </head>
            <body>
            <h1>Upload Test</h1>
            <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="testing" />
            <input type="submit" />
            </form>
            </body>
            </html>`);
});
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
    console.dir(req);
    res.send('File uploaded.');
});
const port = 80;
app.listen(port, () => {
    console.log(`Server app listening on port ${port}`);
});
//# sourceMappingURL=server.js.map