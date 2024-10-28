const crypto = require('crypto');
const User = require('~/models/User');
const Vip = require('~/models/Vip');
const bcrypt = require('bcryptjs');
const Balance = require('~/models/Balance');
const WeixinMsgUtil = require('~/server/utils/WeixinMsgUtil');
const WeixinRequest = require('~/server/utils/WeixinRequest');
const WeixinTokenManager = require('~/server/utils/WeixinTokenManager');
const WeixinConversationManager = require('~/server/utils/WeixinConversationManager');
const WeixinQrCodeCacheUtil = require('~/server/utils/WeixinQrCodeCacheUtil');
const { logger } = require('~/config');

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
    email: `${openid.substring(0, 10)}@user.com`,
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
  let user = await User.findOne({ wxOpenId: openid }).lean();
  if (!user) {
    const user = await weixinApiUtil.getWeixinUser(null, openid);
    const { nickname, headimgurl } = user;
    await createWeixinUser(openid, nickname, headimgurl);
    logger.info(
      '[Handle weixin msg create new user]: ' + user.nickname,
    );
  } else {
    logger.info(
      '[Exists  user]',
    );
    logger.info(
      JSON.stringify(user),
    );
  }
  const receiveMessage = WeixinMsgUtil.msgToReceiveMessage(req);
  // 扫码登录
  if (WeixinMsgUtil.isScanQrCode(receiveMessage)) {
    return handleScanLogin(receiveMessage, openid);
  } else if (WeixinMsgUtil.isEventAndSubscribe(receiveMessage)) {
    return handleSubscribeEvent(receiveMessage, weixinApiUtil);
  } else if (WeixinMsgUtil.isNormalMsg(receiveMessage)) {
    return handleNormalMsg(receiveMessage, weixinApiUtil);
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
const handleSubscribeEvent = async (receiveMessage) => {
  return receiveMessage.getReplyTextMsg('欢迎关注！');
};
/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleNormalMsg = (receiveMessage, weixinApiUtil) => {
  const type = receiveMessage.msgType;
  if (type === 'text') {
    return handleNormalTextMsg(receiveMessage, weixinApiUtil);
  }
  if (type === 'image') {
    return handleNormalImageMsg(receiveMessage, weixinApiUtil);
  }
  return receiveMessage.getReplyTextMsg('暂时不支持此类型的消息');
};

const weixinTokenManager = new WeixinTokenManager();
const weixinConversationManager = new WeixinConversationManager();

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleNormalTextMsg = async (receiveMessage, weixinApiUtil) => {
  const openid = receiveMessage.fromUserName;
  const user = await User.findOne({ wxOpenId: openid }).lean();
  const vip = await Vip.findOne({ user: user.id || user._id }).select('goodsName goodsId goodsLevel expiredTime').lean();
  if (vip) {
    const currentTime = new Date();
    const expiredTime = new Date(vip.expiredTime);
    if (currentTime > expiredTime) {
      const list = await weixinApiUtil.getAssets();
      console.log(list);
      logger.info(
        '[image list]: ',
      );
      const image = list.item.find(i => i.name.includes('continue'));
      if (image) {
        return receiveMessage.getReplyImageMsg(image.media_id);
      }
      return receiveMessage.getReplyTextMsg('请联系客服开通会员');
    } else {
      const content = receiveMessage.content;
      if (content === '结束对话') {
        weixinConversationManager.deleteConversationData(openid);
        return receiveMessage.getReplyTextMsg('本次对话已结束！您可以再次发起对话！');
      }
      const result = await askAiText(content, openid);
      return receiveMessage.getReplyTextMsg(result);
    }
  }
  const list = await weixinApiUtil.getAssets();
  console.log(list);
  logger.info(
    '[image list]: ',
  );
  const image = list.item.find(i => i.name.includes('open'));
  if (image) {
    return receiveMessage.getReplyImageMsg(image.media_id);
  }
  return receiveMessage.getReplyTextMsg('请联系客服开通会员');
};

const askAiText = async (text, openid) => {
  const request = new WeixinRequest(openid, weixinTokenManager);
  return request.getTextResponse(text, weixinConversationManager);
};

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleNormalImageMsg = (receiveMessage) => {
  return receiveMessage.getReplyTextMsg('图片消息');
};

module.exports = {
  checkSignature,
  createWeixinUser,
  handleWeixinMsg,
};
