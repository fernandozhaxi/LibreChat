const { setAuthTokens } = require('~/server/services/AuthService');
const { logger } = require('~/config');
const axios = require('axios');
const User = require('~/models/User');
const bcrypt = require('bcryptjs');
const Balance = require('~/models/Balance');
const crypto = require('crypto');

const wxminiLoginController = async (req, res) => {
  try {
    const { WXMINI_APPID: appId, WXMINI_SECRET: secret } = process.env;
    const code = req.query.code;
    // 1. Get openId from WeChat API
    const response = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`);
    const { openid, errmsg } = response.data;
    if (!openid) {
      return res.status(500).json({ message: errmsg });
    }
    // 2. Check if user already exists in the database
    let user = await User.findOne({
      wxOpenId: openid,
    }).lean();
    if (!user) {
      // 3. Create new user if it doesn't exist
      user = await User.create({
        wxOpenId: openid,
        username: '微信用户',
        email: `${openid}@user.com`,
        password: bcrypt.hashSync('123456789', bcrypt.genSaltSync(10)),
      });

      // set a balance for the new user
      await Balance.updateOne({
        'user': user.id,
      }, {
        $set: {
          tokenCredits: 10000,
        },
      }, { upsert: true });
    }

    const token = await setAuthTokens(user._id, res);
    return res.status(200).send({ token, user });

  } catch (err) {
    logger.error('[loginController]', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const wxLoginController = async (req, res) => {
  const { WX_APPID: appId, WX_SECRET: secret } = process.env;
  const { code } = req.body;

  try {
    // 1. Get access token and openId from WeChat API
    const getAccessUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`;
    const response = await axios.get(getAccessUrl);
    const { openid, access_token, errmsg } = response.data;

    if (!openid) {
      return res.status(500).json({ message: errmsg });
    }

    // 2. Check if user already exists in the database
    let user = await User.findOne({ wxOpenId: openid }).lean();

    if (!user) {
      // 3. Create new user if it doesn't exist
      const getUserInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
      const userResponse = await axios.get(getUserInfoUrl);
      const { nickname, headimgurl } = userResponse.data;

      user = await User.create({
        wxOpenId: openid,
        username: nickname,
        avatar: headimgurl,
        email: `${openid}@user.com`,
        password: bcrypt.hashSync(openid, bcrypt.genSaltSync(10)),
      });

      // set a balance for the new user
      await Balance.updateOne({
        'user': user.id,
      }, {
        $set: {
          tokenCredits: 10000,
        },
      }, { upsert: true });
    }

    // 4. Set the authentication token and respond with user data
    const token = await setAuthTokens(user._id, res);
    return res.status(200).json({ token, user });

  } catch (error) {
    logger.error('[wxLoginController]', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

function getSignature(token, timestamp, nonce) {
  const array = [token, timestamp, nonce];
  array.sort();

  const concatenatedString = array.join('');

  const hash = crypto.createHash('sha1');
  hash.update(concatenatedString);

  return hash.digest('hex');
}
const wxCheckSignature = async (req, res) => {
  const { signature, timestamp, nonce } = req.query;
  let buildSign = getSignature('librechat', timestamp, nonce);
  if (buildSign === signature) {
    return res.status(200).json({ message: 'Something went wrong' });
  }
  return res.status(500).json({ message: 'Something went wrong' });
};
module.exports = {
  wxLoginController,
  wxminiLoginController,
  wxCheckSignature,
};
