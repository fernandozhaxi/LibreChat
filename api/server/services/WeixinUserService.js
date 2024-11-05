const crypto = require('crypto');
const User = require('~/models/User');
const Vip = require('~/models/Vip');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const Balance = require('~/models/Balance');
const WeixinMsgUtil = require('~/server/utils/WeixinMsgUtil');
const WeixinRequest = require('~/server/utils/WeixinRequest');
const WeixinTokenManager = require('~/server/utils/WeixinTokenManager');
const WeixinConversationManager = require('~/server/utils/WeixinConversationManager');
const WeixinQrCodeCacheUtil = require('~/server/utils/WeixinQrCodeCacheUtil');
const { logger } = require('~/config');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
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

const weixinTokenManager = new WeixinTokenManager();
const weixinConversationManager = new WeixinConversationManager();

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
    logger.info('[Handle weixin msg create new user]: ' + user.nickname);
  }
  const receiveMessage = WeixinMsgUtil.msgToReceiveMessage(req);
  // 扫码登录
  if (WeixinMsgUtil.isScanQrCode(receiveMessage)) {
    return handleScanLogin(receiveMessage, openid);
  } else if (WeixinMsgUtil.isEventAndSubscribe(receiveMessage)) {
    return handleSubscribeEvent(receiveMessage, weixinApiUtil);
  } else if (WeixinMsgUtil.isNormalMsg(receiveMessage)) {
    return handleNormalMsg(user, receiveMessage, weixinApiUtil);
  } else if (WeixinMsgUtil.isMenuClickEvent(receiveMessage)) {
    return handleMenueClickEvent(user, receiveMessage, weixinApiUtil);
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
const handleNormalMsg = async (user, receiveMessage, weixinApiUtil) => {
  const type = receiveMessage.msgType;
  // 判断会员情况
  const openid = receiveMessage.fromUserName;
  if (['text', 'image', 'voice'].includes(type)) {
    const user = await User.findOne({ wxOpenId: openid }).lean();
    const vip = await Vip.findOne({ user: user.id || user._id })
      .select('goodsName goodsId goodsLevel expiredTime')
      .lean();
    const currentTime = new Date();
    if (vip && currentTime <= new Date(vip.expiredTime)) {
      if (receiveMessage.content === '结束对话') {
        weixinConversationManager.deleteConversationData(openid);
        return receiveMessage.getReplyTextMsg('本次对话已结束！您可以再次发起对话！');
      }
      customerHandleMsg(type, user, receiveMessage, weixinApiUtil);
      // 这里直接返回success字符串，然后真正的回复交给客服接口
      return 'success';
    } else {
      return vip
        ? await handleVipExpired(receiveMessage, weixinApiUtil)
        : await handleVipNotActive(receiveMessage, weixinApiUtil);
    }
  }
  return receiveMessage.getReplyTextMsg('目前我只能处理文本、图片、语音消息。');
};

const handleVipExpired = async (receiveMessage, weixinApiUtil) => {
  const list = await weixinApiUtil.getAssets();
  const image = list.item.find((i) => i.name.includes('continue'));
  return image
    ? receiveMessage.getReplyImageMsg(image.media_id)
    : receiveMessage.getReplyTextMsg('请联系客服续费会员');
};

const handleVipNotActive = async (receiveMessage, weixinApiUtil) => {
  const list = await weixinApiUtil.getAssets();
  const image = list.item.find((i) => i.name.includes('open'));
  return image
    ? receiveMessage.getReplyImageMsg(image.media_id)
    : receiveMessage.getReplyTextMsg('请联系客服开通会员');
};

// 让客服接口回复消息，避免5秒超时
const customerHandleMsg = (type, user, receiveMessage, weixinApiUtil) => {
  setTimeout(() => {
    if (type === 'text') {
      // const file = fs.createReadStream(path.join(__dirname, 'uploads', '123.mp3'));
      // weixinApiUtil.addvoicetorecofortext(file).then(res => {
      //   console.log('识别结果', res);
      // });
      handleNormalTextMsg(receiveMessage, weixinApiUtil);
    }
    if (type === 'image') {
      handleNormalImageMsg(user, receiveMessage, weixinApiUtil);
    }
    if (type === 'voice') {
      handleNormalVoiceMsg(receiveMessage, weixinApiUtil);
    }
  }, 0);
};

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleMenueClickEvent = async (user, receiveMessage, weixinApiUtil) => {
  const eventKey = receiveMessage.eventKey;
  let content = '';
  switch (eventKey) {
    case 'techer':
      content = '请你扮演资深教师与我对话';
      break;
    case 'destiny':
      content = '请你扮演算命先生与我对话';
      break;
    case 'guide':
      content = '请你扮演资深导游与我对话';
      break;
    case 'customer':
      content = '请你扮演客服与我对话';
      break;
  }
  receiveMessage.content = content;
  customerHandleMsg('text', user, receiveMessage, weixinApiUtil);
  return 'success';
};

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleNormalTextMsg = async (receiveMessage, weixinApiUtil) => {
  const openid = receiveMessage.fromUserName;
  const content = receiveMessage.content;
  const result = await askAiText(content, openid);
  let msg = '';
  if (result) {
    msg = receiveMessage.getReplyTextJsonMsg(result);
  } else {
    msg = receiveMessage.getReplyTextJsonMsg('服务器发生了错误，请重试。');
  }

  weixinApiUtil.sendCustomerMsg(msg);
};

const askAiText = async (text, openid) => {
  const request = new WeixinRequest(openid, weixinTokenManager);
  return await request.getTextResponse(text, weixinConversationManager);
};

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleNormalImageMsg = async (user, receiveMessage, weixinApiUtil) => {
  const openid = receiveMessage.fromUserName;
  const { picUrl } = receiveMessage;
  const request = new WeixinRequest(openid, weixinTokenManager);
  const success = await request.uploadImage(user, picUrl, weixinConversationManager);
  let msg = '';
  if (success) {
    msg = receiveMessage.getReplyTextJsonMsg('您发了一张图片，需要我做什么？');
  } else {
    msg = receiveMessage.getReplyTextJsonMsg('图片消息接收失败，请重试');
  }
  weixinApiUtil.sendCustomerMsg(msg);
};

/**
 *
 * @param {ReceiveMessage} receiveMessage
 * @returns template msg
 */
const handleNormalVoiceMsg = async (receiveMessage, weixinApiUtil) => {
  const { mediaId } = receiveMessage;
  const response = await weixinApiUtil.getTempAssets(mediaId);
  // 指定临时文件路径
  const uniqueId = uuidv4();
  fs.ensureDirSync(path.join(__dirname, 'uploads'));
  const armFilePath = path.join(__dirname, 'uploads', `${uniqueId}.temp`);
  const mp3FilePath = path.join(__dirname, 'uploads', `${uniqueId}.mp3`);
  const dest = fs.createWriteStream(armFilePath);
  response.pipe(dest);
  dest.on('finish', () => {
    try {
      // 转换 ARM 文件为 MP3
      ffmpeg(armFilePath)
        .audioChannels(1) // 单声道
        .audioFrequency(16000) // 16k
        .toFormat('mp3')
        .save(mp3FilePath)
        .on('end', async () => {
          const file = fs.createReadStream(mp3FilePath);
          const result = await weixinApiUtil.addvoicetorecofortext(file);
          fs.unlinkSync(mp3FilePath);
          fs.unlinkSync(armFilePath);
          if (result) {
            receiveMessage.content = result;
            handleNormalTextMsg(receiveMessage, weixinApiUtil);
          } else {
            const msg = receiveMessage.getReplyTextJsonMsg('未能识别您的语音，请重试');
            weixinApiUtil.sendCustomerMsg(msg);
          }
        });
    } catch (error) {
      console.log(error);
    }
  });
};

module.exports = {
  checkSignature,
  createWeixinUser,
  handleWeixinMsg,
};
