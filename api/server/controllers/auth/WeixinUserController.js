const { setAuthTokens } = require('~/server/services/AuthService');
const { logger } = require('~/config');
const User = require('~/models/User');
const WeixinApiUtil = require('~/server/utils/WeixinApiUtil');
const { createWeixinUser } = require('~/server/services/WeixinUserService');
const WeixinQrCodeCacheUtil = require('~/server/utils/WeixinQrCodeCacheUtil');

const weixinApiUtil = new WeixinApiUtil();
const wxOAuthLoginController = async (req, res) => {
  const { code } = req.body;

  try {
    const { openid, access_token, errmsg } = await weixinApiUtil.getOauth2InfoByCode(code);
    if (!openid) {
      return res.status(500).json({ message: errmsg });
    }

    // 2. Check if user already exists in the database
    let user = await User.findOne({ wxOpenId: openid }).lean();

    if (!user) {
      // 3. Create new user if it doesn't exist
      const { nickname, headimgurl } = await weixinApiUtil.getWeixinUser(access_token, openid);
      user = await createWeixinUser(openid, nickname, headimgurl);
    }

    // 4. Set the authentication token and respond with user data
    const token = await setAuthTokens(user._id, res);
    return res.status(200).json({ token, user });
  } catch (error) {
    logger.error('[wxLoginController]', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// 获取微信登录二维码
const getWxQrCode = async (req, res) => {
  try {
    const qrInfo = await weixinApiUtil.getQrCode();
    res.status(200).json(qrInfo);
  } catch (error) {
    res.status(500).send(error);
  }
};

// 检查是否扫码成功
const wxCheckQrCode = async (req, res) => {
  const { code } = req.body;
  const openId = WeixinQrCodeCacheUtil.get(code);
  if (openId) {
    let user = await User.findOne({ wxOpenId: openId }).lean();
    const token = await setAuthTokens(user._id, res);
    res.status(200).send({ token, user });
  } else {
    res.status(200).json({});
  }
};

module.exports = {
  wxOAuthLoginController,
  getWxQrCode,
  wxCheckQrCode,
};
