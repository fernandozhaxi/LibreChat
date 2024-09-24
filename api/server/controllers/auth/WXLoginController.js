const { setAuthTokens } = require('~/server/services/AuthService');
const { logger } = require('~/config');
const axios = require('axios');
const User = require('~/models/User');
const bcrypt = require('bcryptjs');
const Balance = require('~/models/Balance');
const crypto = require('crypto');
const WeixinApiUtil = require('~/server/utils/WeixinApiUtil');

const { WX_APPID: appId, WX_SECRET: secret } = process.env;
const weixinApiUtil = new WeixinApiUtil(appId, secret);

const wxLoginController = async (req, res) => {
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

      user = await User.create({
        wxOpenId: openid,
        username: nickname,
        avatar: headimgurl,
        email: `${openid}@user.com`,
        password: bcrypt.hashSync(openid, bcrypt.genSaltSync(10)),
      });

      // Set a balance for the new user
      await Balance.updateOne(
        {
          user: user.id,
        },
        {
          $set: {
            tokenCredits: 10000,
          },
        },
        { upsert: true },
      );
    }

    // 4. Set the authentication token and respond with user data
    const token = await setAuthTokens(user._id, res);
    return res.status(200).json({ token, user });
  } catch (error) {
    logger.error('[wxLoginController]', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const checkSignature = (req) => {
  const { signature, timestamp, nonce } = req.query;
  const array = ['librechat', timestamp, nonce];
  array.sort();
  const concatenatedString = array.join('');
  const hash = crypto.createHash('sha1');
  hash.update(concatenatedString);
  const buildSign = hash.digest('hex');
  return signature == buildSign;
};

// 用于配置服务器时做token验证
const wxCheckSignature = async (req, res) => {
  const { echostr } = req.query;
  if (checkSignature(req)) {
    return res.status(200).send(echostr);
  }
  return res.status(500).send('Something went wrong');
};

// 扫码后接收微信事件以及后续处理
const wxCheckSignatureCallback = async (req, res) => {
  if (checkSignature(req)) {
    // const { openid } = req.query;
    console.log('query', req.query);
    console.log('body', req.body);
    const xmlData = `<xml>
      <ToUserName><![CDATA[toUser]]></ToUserName>
      <FromUserName><![CDATA[fromUser]]></FromUserName>
      <CreateTime>12345678</CreateTime>
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[你好]]></Content>
    </xml>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xmlData);
    // 拿到openid就走系统登录流程
    return res.status(200).send('登录成功！');
  }
  return res.status(500).send('Something went wrong');
};

// 获取微信登录二维码
const getWxQrCode = async (req, res) => {
  try {
    const qrCode = await weixinApiUtil.getQrCode();
    console.log(qrCode);
    return res.status(200).json(qrCode);
  } catch (error) {
    res.status(500).send('Something went wrong');
  }
};

// 检查是否扫码成功
const wxCheckQrCode = async (req, res) => {
  // const { WX_APPID: appId } = process.env;
};

module.exports = {
  wxLoginController,
  wxCheckSignature,
  wxCheckSignatureCallback,
  getWxQrCode,
  wxCheckQrCode,
};
