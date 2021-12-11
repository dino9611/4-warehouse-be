const multer = require("multer");
const fs = require("fs");

const uploader = (destination, filenamePrefix) => {
    let defaultPath = "./public/assets/images/uploaded/";

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const directory = defaultPath + destination;
            if (fs.existsSync(directory)) {
                cb(null, directory)
            } else {
                fs.mkdir(directory, {recursive: true}, (error) => cb(error, directory))
            };
        },
        filename: (req, file, cb) => {
            const getTime = new Date();
            let year = getTime.getFullYear();
            let month = getTime.getMonth() + 1;
            let day = getTime.getDate();
            let milliseconds = getTime.getMilliseconds();

            let originalName = file.originalname;
            let extension = originalName.split(".")
            let filename = filenamePrefix + `${year.toString() + month.toString() + day.toString() + milliseconds.toString()}` + "." + extension[extension.length - 1];
            cb(null, filename);
        }
    });

    const imageExtFilter = (req, file, cb) => {
        const extension = /\.(jpg|jpeg|png)$/;
        if (!file.originalname.match(extension)) {
            return cb(new Error("Please upload the only file type allowed"))
        } else {
            cb(null, true)
        };
    };

    return multer({
        storage: storage,
        fileFilter: imageExtFilter,
        limits: 2.5 * 1024 * 1024 // Max upload file size +- 2.5MB
    })
}

module.exports = uploader;