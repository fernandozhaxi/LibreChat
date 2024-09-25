const { setAuthTokens } = require('~/server/services/AuthService');
const { logger } = require('~/config');
const User = require('~/models/User');
const bcrypt = require('bcryptjs');
const Balance = require('~/models/Balance');
const crypto = require('crypto');
const WeixinApiUtil = require('~/server/utils/WeixinApiUtil');
const fetch = require('node-fetch');

const weixinApiUtil = new WeixinApiUtil();

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
      user = await addUser(openid, nickname, headimgurl);
    }

    // 4. Set the authentication token and respond with user data
    const token = await setAuthTokens(user._id, res);
    return res.status(200).json({ token, user });
  } catch (error) {
    logger.error('[wxLoginController]', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const addUser = async (openid, nickname, headimgurl) => {
  const user = await User.create({
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
  return user;
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
  return res.status(500).send('Wechat verify failed!');
};

// 扫码后接收微信事件以及后续处理
const wxCheckSignatureCallback = async (req, res) => {
  if (checkSignature(req)) {
    // 用户关注/取关/发消息给公众号，扫码都会走这个方法，需要根据消息类型处理相关逻辑
    const { openid } = req.query;
    console.log('query', req.query);
    const str = byteStream.toString('utf8');
    const jsonObject = JSON.parse(str);
    const { ToUserName, FromUserName, CreateTime, MsgType, Content, Ticket } = jsonObject;
    console.log(ToUserName, FromUserName, CreateTime, MsgType, Content);
    console.log(MsgType);
    if (MsgType === 'subscribe') {
      // 1. Check if user already exists in the database
      let user = await User.findOne({ wxOpenId: openid }).lean();
      if (!user) {
        // 2. Create new user if it doesn't exist
        const { nickname, headimgurl } = await weixinApiUtil.getWeixinUser(null, openid);
        user = await addUser(openid, nickname, headimgurl);
      }
      // 对ticket进行hash
      // const ticketHash = bcrypt.hashSync(Ticket, bcrypt.genSaltSync(10));
      // TODO存储到redis

      // 构造模版消息
      const templateMessage = {
        touser: openid,
        template_id: '',
        url: '',
        data: {
          time: { value: '现在时间' },
          status: { value: '登录成功！' },
          ip: { value: '用户IP' },
        },
      };

      // 发送给微信服务器
      fetch({
        method: 'POST',
        // url: ''+`?access_token=${}`,
        json: JSON.stringify(templateMessage),
      });
    }
  }
  return res.status(500).send('Something went wrong');
};

// 获取微信登录二维码
const getWxQrCode = async (req, res) => {
  console.log('获取微信二维码');
  try {
    const qrCode = await weixinApiUtil.getQrCode();
    console.log('qrCode', qrCode);
    res.status(200).json(qrCode);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

// 检查是否扫码成功
const wxCheckQrCode = async (req, res) => {
  // 根据用户传过来的code，检查数据库中的状态
  // 关联ticket和openId到数据库，客户端轮询的时候，自动登录。
  // const token = await setAuthTokens(user._id, res);
  // const { WX_APPID: appId } = process.env;
};

module.exports = {
  wxLoginController,
  wxCheckSignature,
  wxCheckSignatureCallback,
  getWxQrCode,
  wxCheckQrCode,
};
