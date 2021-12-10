const multer = require("multer");
const fs = require("fs");

const uploader = (destination, filenamePrefix) => {
    let defaultPath = "./public/assets/images";

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            console.log("Multer line 8: ",file);
            const directory = defaultPath + destination;
            console.log("Directory line 11: ", directory);
            if (fs.existsSync(directory)) {
                console.log("Directory exist line 13: ", directory)
                cb(null, directory)
            } else {
                fs.mkdir(directory, {recursive: true}, (error) => cb(error, directory))
                console.log("Directory make line 17: ", directory)
            }
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