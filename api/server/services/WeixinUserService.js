const crypto = require('crypto');
const User = require('~/models/User');
const Vip = require('~/models/Vip');
const bcrypt = require('bcryptjs');
const Balance = require('~/models/Balance');
const WeixinMsgUtil = require('~/server/utils/WeixinMsgUtil');
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
 * @param {string} openid
 * @param {string} nickname
 * @param {string} avatar
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

/**
 * 处理微信对我们服务器的登录回调
 */

const handleWeixinMsg = async (req, weixinApiUtil) => {
  const { openid } = req.query;
  const receiveMessage = WeixinMsgUtil.msgToReceiveMessage(req);
  // 扫码登录
  if (WeixinMsgUtil.isScanQrCode(receiveMessage)) {
    let user = await User.findOne({ wxOpenId: openid }).lean();
    if (!user) {
      const user = await weixinApiUtil.getWeixinUser(null, openid);
      const { nickname, headimgurl } = user;
      await createWeixinUser(openid, nickname, headimgurl);
    }
    return handleScanLogin(receiveMessage, openid);
  } else if (WeixinMsgUtil.isEventAndSubscribe(receiveMessage)) {
    return handleFocusEvent(receiveMessage, weixinApiUtil);
  } else if (WeixinMsgUtil.isNormalMsg(receiveMessage)) {
    return handleNormalMsg(receiveMessage);
  }
};

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleScanLogin = (receiveMessage) => {
  const ticket = WeixinMsgUtil.getQrCodeTicket(receiveMessage);
  if (!WeixinQrCodeCacheUtil.get(ticket)) {
    const openId = receiveMessage.fromUserName;
    WeixinQrCodeCacheUtil.put(ticket, openId);
  }

  return receiveMessage.getReplyTextMsg('登录成功！');
};

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleFocusEvent = async (receiveMessage, weixinApiUtil) => {
  const openid = receiveMessage.fromUserName;
  let user = await User.findOne({ wxOpenId: openid }).lean();
  if (!user) {
    const user = await weixinApiUtil.getWeixinUser(null, openid);
    const { nickname, headimgurl } = user;
    await createWeixinUser(openid, nickname, headimgurl);
  }
  return receiveMessage.getReplyTextMsg('欢迎关注！');
};
/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleNormalMsg = (receiveMessage) => {
  const type = receiveMessage.msgType;
  if (type === 'text') {
    return handleNormalTextMsg(receiveMessage);
  }
  if (type === 'image') {
    return handleNormalImageMsg(receiveMessage);
  }
  return receiveMessage.getReplyTextMsg('暂时不支持此类型的消息');
};

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleNormalTextMsg = async (receiveMessage) => {
  const openid = receiveMessage.fromUserName;
  const user = await User.findOne({ wxOpenId: openid }).lean();
  const vip = await Vip.findOne({ user: user.id || user._id }).select('goodsName goodsId goodsLevel expiredTime').lean();
  if (vip) {
    // 判断是否过期
    const currentTime = new Date();
    const expiredTime = new Date(vip.expiredTime);
    if (currentTime > expiredTime) {
      return receiveMessage.getReplyTextMsg('您的会员已过期，请联系客服充值！');
    } else {
      const content = receiveMessage.content;
      // 判断是否需要重新登录

      // 判断是否有没有结束的对话

      // 继续调用ask接口对话？

      // 把content转发给openAi，只能使用mini模型
      return receiveMessage.getReplyTextMsg('您是尊贵的' + vip.goodsName);
    }
  }

  return receiveMessage.getReplyTextMsg('请联系客服开通会员！');
};

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleNormalImageMsg = (receiveMessage) => {
  console.log(receiveMessage);
  return receiveMessage.getReplyTextMsg('图片消息');
};

module.exports = {
  checkSignature,
  createWeixinUser,
  handleWeixinMsg,
};
