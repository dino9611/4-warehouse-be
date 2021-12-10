const express = require("express");
const router = express.Router();
const uploader = require("./../helpers/Uploader");
const { profileController } = require("./../controllers");
const { inputPersonalData } = require("../controllers/profileController");
const { uploadProfilePicture, getPersonalData } = profileController;

const uploadFile = uploader("/photo-profile", "PROF").fields([
  { name: "image", maxCount: 3 },
]);

router.patch("/upload-photo/:userId", uploadFile, uploadProfilePicture);
router.get("/personal-data/:userId", getPersonalData);
router.post("/edit/personal-data/:userId", inputPersonalData);

module.exports = router;
