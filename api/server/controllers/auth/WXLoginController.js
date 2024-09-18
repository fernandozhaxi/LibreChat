const { setAuthTokens } = require('~/server/services/AuthService');
const { logger } = require('~/config');
const axios = require('axios');
const User = require('~/models/User');
const bcrypt = require('bcryptjs');

const wxLoginController = async (req, res) => {
  try {
    // 调用微信的登录接口，获取openId
    const appId = process.env.WXMINI_APPID;
    const secret = process.env.WXMINI_SECRET;
    const code = req.query.code;

    console.log('appId', appId);
    console.log('secret', secret);
    console.log('code', code);

    const response = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`);
    const { openid, errmsg } = response.data;
    console.log('data', response.data);
    if (openid) {
      let user = await User.findOne({
        wxOpenId: openid,
      }).lean();
      if (!user) {
        console.log('openId对应的用户不存在，创建！');
        // 不存在该openId对应的用户，就建一个
        user = await User.create({
          wxOpenId: openid,
          username: '微信用户',
          email: `${openid}@user.com`,
          password: bcrypt.hashSync('123456789', bcrypt.genSaltSync(10)),
        });
      }

      const token = await setAuthTokens(user._id, res);
      return res.status(200).send({ token });
    } else {
      return res.status(500).json({ message: errmsg });
    }
  } catch (err) {
    logger.error('[loginController]', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  wxLoginController,
};
