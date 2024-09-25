
const crypto = require('crypto');
const User = require('~/models/User');
const bcrypt = require('bcryptjs');
const Balance = require('~/models/Balance');
const WeixinMsgUtil = require('~/server/utils/WeixinMsgUtil');
const WeixinApiUtil = require('~/server/utils/WeixinApiUtil');
const WeixinQrCodeCacheUtil = require('~/server/utils/WeixinQrCodeCacheUtil');
/**
 * @param {string} signature
 * @param {string} timestamp
 * @param {string} nonce
 */
const checkSignature = (signature, timestamp, nonce) => {
  const array = ['librechat', timestamp, nonce];
  array.sort();
  const concatenatedString = array.join('');
  const hash = crypto.createHash('sha1');
  hash.update(concatenatedString);
  const buildSign = hash.digest('hex');
  return signature == buildSign;
};

/**
 * 处理微信对我们服务器的回调
 */
const handleWeixinMsg = async (req) => {
  const receiveMessage = WeixinMsgUtil.msgToReceiveMessage(req);
  const { openid } = req.query;
  // 扫码登录
  if (WeixinMsgUtil.isScanQrCode(receiveMessage)) {
    console.log('扫码登录');
    return handleScanLogin(receiveMessage);
  }
  // 关注公众号
  if (WeixinMsgUtil.isEventAndSubscribe(receiveMessage)) {
    console.log('关注公众号');
    let user = await User.findOne({ wxOpenId: openid }).lean();
    if (!user) {
      const { nickname, headimgurl } = await WeixinApiUtil.getWeixinUser(null, openid);
      user = await createWeixinUser(openid, nickname, headimgurl);
    }
    return receiveMessage.getReplyTextMsg('欢迎关注');
  }
  return receiveMessage.getReplyTextMsg('收到（自动回复）');
};

const handleScanLogin = (receiveMessage) => {
  const ticket = WeixinMsgUtil.getQrCodeTicket(receiveMessage);
  if (WeixinQrCodeCacheUtil.get(ticket) === null) {
    const openId = receiveMessage.fromUserName;
    WeixinQrCodeCacheUtil.put(ticket, openId);
  }
  return receiveMessage.getReplyTextMsg('登录成功！');
};

/**
 * @param {string} signature
 */
const createWeixinUser = async (openid, nickname, avatar) => {
  const user = await User.create({
    wxOpenId: openid,
    username: nickname,
    avatar: avatar,
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

module.exports = {
  checkSignature,
  handleWeixinMsg,
  createWeixinUser,
};
