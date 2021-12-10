const express = require("express");
const router = express.Router();
const uploader = require("./../helpers/Uploader");
const { profileController } = require("./../controllers");
const { uploadProfilePicture, categories } = profileController;

const uploadFile = uploader("/photo-profile", "PROF").fields([
  { name: "image", maxCount: 3 },
]);

router.patch("/upload-photo/:userId", uploadFile, uploadProfilePicture);
router.get("/category", categories);

module.exports = router;
