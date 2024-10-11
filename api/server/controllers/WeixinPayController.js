// const { logger } = require('~/config');

const WeixinApiUtil = require('~/server/utils/WeixinApiUtil');
const weixinApiUtil = new WeixinApiUtil();

/**
 * 创建微信支付订单, 返回支付二维码给客户端
 */
const createOrderPC = async (req, res) => {
  try {
    const payData = await weixinApiUtil.createPrePayOrderForPC(req);
    if (payData) {
      res.status(200).send(payData);
    } else {
      res.status(500).send('创建订单失败！');
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

/**
 * 检查是否支付成功
 */
const wxCheckPay = async (req, res) => {
  // const { code } = req.body;
  // const openId = WeixinQrCodeCacheUtil.get(code);
  // if (openId) {
  //   let user = await User.findOne({ wxOpenId: openId }).lean();
  //   const token = await setAuthTokens(user._id, res);
  //   res.status(200).send({ token, user });
  // } else {
  //   res.status(200).json({});
  // }
};

// 用户扫码支付后接收微信事件以及后续处理
const wxPayNotify = async (req, res) => {
  await weixinApiUtil.handleWeixinPayMsg(req, res);
};

module.exports = {
  createOrderPC,
  wxCheckPay,
  wxPayNotify,
};

