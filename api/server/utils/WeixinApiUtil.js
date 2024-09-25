const fetch = require('node-fetch');
// const qs = require('qs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const { WX_APPID, WX_SECRET } = process.env;

class WeixinApiUtil {
  constructor() {
    this.appId = WX_APPID;
    this.appSecret = WX_SECRET;

    this.QR_CODE_URL_PREFIX = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=';
    this.ACCESS_TOKEN = null;
    this.ACCESS_TOKEN_EXPIRE_TIME = null;
    this.QR_CODE_TICKET_TIMEOUT = 10 * 60; // QR code ticket timeout (in seconds)
  }

  async getOauth2InfoByCode(code) {
    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${this.appId}&secret=${this.appSecret}&code=${code}&grant_type=authorization_code`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching OAuth2 info:', error);
      throw error;
    }
  }

  /**
   * 获取微信用户信息
   * @param {} access_token
   * @param {*} openid
   * @returns
   */
  async getWeixinUser(access_token, openid) {
    const token = access_token || this.ACCESS_TOKEN;
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${token}&openid=${openid}&lang=zh_CN`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching Weixin user info:', error);
      throw error;
    }
  }

  async getAccessToken() {
    if (this.ACCESS_TOKEN && moment().isBefore(this.ACCESS_TOKEN_EXPIRE_TIME)) {
      return this.ACCESS_TOKEN;
    }
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.ACCESS_TOKEN = data.access_token;
      this.ACCESS_TOKEN_EXPIRE_TIME = moment().add(data.expires_in - 10, 'seconds'); // 预留10秒过期
      return this.ACCESS_TOKEN;
    } catch (error) {
      throw new Error('HTTP error! ');
    }
  }

  /**
   * 获取微信登录二维码
   * @return
   */
  async getQrCode() {
    try {
      const accessToken = await this.getAccessToken();
      if (accessToken) {
        const url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`;

        const jsonBody = {
          expire_seconds: this.QR_CODE_TICKET_TIMEOUT,
          action_name: 'QR_STR_SCENE',
          action_info: {
            scene: {
              scene_str: uuidv4(),
            },
          },
        };
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(jsonBody),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const weixinQrCode = {
          code: data.ticket,
          url: `${this.QR_CODE_URL_PREFIX}${encodeURIComponent(data.ticket)}`,
        };
        return weixinQrCode;
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }
}

module.exports = WeixinApiUtil;
