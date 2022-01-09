const express = require("express");
const router = express.Router();
const uploader = require("./../helpers/Uploader");
const verifyTokenChangeEmail = require("../helpers/verifyTokenChangeEmail");
const { profileController } = require("./../controllers");
const {
  inputPersonalData,
  getPersonalData,
  changePassword,
  onChangeEmail,
  verifyChangeEmail,
} = profileController;

const uploadFile = uploader("/photo-profile", "PROF").fields([
  { name: "image", maxCount: 3 },
]);

router.get("/personal-data/:userId", getPersonalData);
router.post("/edit/personal-data/:userId", uploadFile, inputPersonalData);
router.patch("/change-password/:userId", changePassword);
router.patch("/change-email/:userId", onChangeEmail);
router.get("/auth/change-email", verifyTokenChangeEmail, verifyChangeEmail);

module.exports = router;
