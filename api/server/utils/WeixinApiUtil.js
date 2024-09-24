
const axios = require('axios');
// const qs = require('qs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class WeixinApiUtil {

  constructor(appId, appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;

    this.QR_CODE_URL_PREFIX = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=';
    this.ACCESS_TOKEN = null;
    this.ACCESS_TOKEN_EXPIRE_TIME = null;
    this.QR_CODE_TICKET_TIMEOUT = 10 * 60; // QR code ticket timeout (in seconds)
  }

  async getOauth2InfoByCode(code) {
    const api = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.appId}&secret=${this.appSecret}&code=${code}&grant_type=authorization_code`;
    const response = await axios.get(api);
    return response.data;
  }

  async getWeixinUser(access_token, openid) {
    const api = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
    const response = await axios.get(api);
    return response.data;
  }

  async getAccessToken() {
    if (this.ACCESS_TOKEN && moment().isBefore(this.ACCESS_TOKEN_EXPIRE_TIME)) {
      return this.ACCESS_TOKEN;
    }

    const api = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
    const result = await axios.get(api);
    this.ACCESS_TOKEN = result.data.access_token;
    this.ACCESS_TOKEN_EXPIRE_TIME = moment().add(result.data.expires_in - 10, 'seconds'); // 预留10秒过期

    return this.ACCESS_TOKEN;
  }

  async getQrCode() {
    const accessToken = await this.getAccessToken();
    const api = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`;

    const jsonBody = {
      expire_seconds: this.QR_CODE_TICKET_TIMEOUT,
      action_name: 'QR_STR_SCENE',
      action_info: {
        scene: {
          scene_str: uuidv4(), // 随机场景字符串
        },
      },
    };

    const result = await axios.post(api, jsonBody);

    const weixinQrCode = {
      code: result.data.ticket,
      url: `${this.QR_CODE_URL_PREFIX}${encodeURIComponent(result.data.ticket)}`, // 生成二维码 URL
    };

    return weixinQrCode;
  }

}

module.exports = WeixinApiUtil;