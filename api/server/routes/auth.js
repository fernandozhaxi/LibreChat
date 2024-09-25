const express = require('express');
const {
  refreshController,
  registrationController,
  resetPasswordController,
  resetPasswordRequestController,
} = require('~/server/controllers/AuthController');
const { loginController } = require('~/server/controllers/auth/LoginController');
const { logoutController } = require('~/server/controllers/auth/LogoutController');
const {
  wxOAuthLoginController,
  getWxQrCode,
  wxCheckQrCode,
} = require('~/server/controllers/auth/WeixinUserController');

const {
  weixinCheckGet,
  weixinCheckPost,
} = require('~/server/controllers/auth/WeixinServerController');

const {
  checkBan,
  loginLimiter,
  checkAdmin,
  requireJwtAuth,
  checkInviteUser,
  registerLimiter,
  requireLdapAuth,
  requireLocalAuth,
  resetPasswordLimiter,
  validateRegistration,
  validatePasswordReset,
} = require('~/server/middleware');

const router = express.Router();

const ldapAuth = !!process.env.LDAP_URL && !!process.env.LDAP_USER_SEARCH_BASE;
//Local
router.post('/logout', requireJwtAuth, logoutController);
router.post(
  '/login',
  loginLimiter,
  checkBan,
  ldapAuth ? requireLdapAuth : requireLocalAuth,
  loginController,
);
router.post('/refresh', refreshController);
router.post(
  '/register',
  registerLimiter,
  checkBan,
  checkInviteUser,
  validateRegistration,
  registrationController,
);
router.post('/createUser', requireJwtAuth, checkBan, checkAdmin, registrationController);
router.post(
  '/requestPasswordReset',
  resetPasswordLimiter,
  checkBan,
  validatePasswordReset,
  resetPasswordRequestController,
);
router.post('/resetPassword', checkBan, validatePasswordReset, resetPasswordController);

// Wechat login
router.post('/wxLogin', loginLimiter, checkBan, wxOAuthLoginController);
router.get('/wxCheck', checkBan, weixinCheckGet);
router.post('/wxCheck', checkBan, weixinCheckPost);
router.post('/wxQrcode', checkBan, getWxQrCode);
router.post('/wxQrLogin', checkBan, wxCheckQrCode);

module.exports = router;
