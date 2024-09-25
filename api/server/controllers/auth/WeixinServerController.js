const { checkSignature, handleWeixinMsg } = require('~/server/services/WeixinUserService');

// 用于配置服务器时做token验证
const weixinCheckGet = async (req, res) => {
  const { echostr, signature, timestamp, nonce } = req.query;
  if (checkSignature(signature, timestamp, nonce)) {
    return res.status(200).send(echostr);
  }
  return res.status(500).send('Wechat verify failed!');
};

// 扫码后接收微信事件以及后续处理
const weixinCheckPost = async (req, res) => {
  const { signature, timestamp, nonce } = req.query;
  if (checkSignature(signature, timestamp, nonce)) {
    const text = await handleWeixinMsg(req);
    return res.status(200).send(text);
  }
  return res.status(500).send('Wechat verify failed!');
};

module.exports = {
  weixinCheckGet,
  weixinCheckPost,
};
