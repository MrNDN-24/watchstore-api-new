// Routes
const express = require("express");
const {
  register,
  login,
  googleLogin,
  adminLogin,
  sendEmailAdmin,
  resetPasswordAdmin,
  sendEmail,
  resetPassword,
  facebookLogin,
  logout
} = require("../controllers/authController");
const { verifyUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/facebook-login", facebookLogin);
router.post("/adminLogin", adminLogin);
router.post("/forgotpasswordAdmin", sendEmailAdmin );
router.post("/reset_passwordAdmin/:id/:token", resetPasswordAdmin);
router.post("/forgotpassword", sendEmail );
router.post("/reset_password/:id/:token", resetPassword);
router.post("/logout",verifyUser, logout);
module.exports = router;
