const multer = require("multer");
const fs = require("fs");

const uploader = (destination, filenamePrefix) => {
  let defaultPath = "./public";

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = defaultPath + destination;

      if (fs.existsSync(dir)) {
        cb(null, dir);
      } else {
        fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
      }
    },

    filename: (req, file, cb) => {
      let oriName = file.originalname;
      let ext = oriName.split(".");
      let filename = filenamePrefix + Date.now() + "." + ext[ext.length - 1];

      cb(null, filename);
    },
  });

  const imageFilter = (req, file, callback) => {
    const ext = /\.(jpg|jpeg|png|gif|)$/;

    if (!file.originalname.match(ext)) {
      return callback(new Error("Only selected file type are allowed"));
    }

    callback(null, true);
  };

  return multer({
    storage,
    fileFilter: imageFilter,
    limits: {
      fileSize: 2 * 1024 * 1024,
    },
  });
};

module.exports = uploader;
