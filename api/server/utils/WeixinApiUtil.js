const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { logger } = require('~/config');
// const WxPay = require('wechatpay-node-v3');
// const Goods = require('~/models/Goods');

const { WX_APPID, WX_SECRET, WX_MCH_ID, WX_SERIAL_NO, WX_API_KEY } = process.env;
const wxConfig = {
  appid: WX_APPID, // 服务号的appid
  secret: WX_SECRET, // 服务号的秘钥
  mchid: WX_MCH_ID, // 商户号
  apiV3Key: WX_API_KEY,
  serial_no: WX_SERIAL_NO, //商户API证书序列号
  // publicKey: fs.readFileSync('~/server/cert/apiclient_cert.pem').toString(),
  // privateKey: fs.readFileSync('~/server/cert/apiclient_key.pem').toString(),
};

// const wxPay = new WxPay({
//   appid: wxConfig.appid,
//   mchid: wxConfig.mchid,
//   publicKey: wxConfig.publicKey,
//   privateKey: wxConfig.privateKey,
// });

class WeixinApiUtil {
  constructor() {
    this.appId = wxConfig.appid;
    this.appSecret = wxConfig.secret;

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
    const token = access_token || (await this.getAccessToken());
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${token}&openid=${openid}&lang=zh_CN`;

    try {
      const response = await fetch(url);
      console.log('获取微信用户', response);
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
    const appId = this.appId || 'wx74c42da7684bde66';
    const appSecret = this.appSecret || '37e105863e93aef07df1c6482adab1af';
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log('请求token', data);
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
        url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(
          data.ticket,
        )}`,
      };
      return weixinQrCode;
    }
  }

  async getAssets(type = 'image') {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        type: type,
        offset: 0,
        count: 20,
      }),
    });
    return await response.json();
  }

  async getTempAssets(mediaId) {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/media/get?access_token=${accessToken}&media_id=${mediaId}`;
    const response = await fetch(url, {
      method: 'GET',
    });
    if (response.status === 200) {
      return response.body;
    }
    return;
  }

  async createCustomMenus() {
    const accessToken = await this.getAccessToken();
    // 菜单需要先删除，再创建
    const deleteUrl = ` https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${accessToken}`;
    await fetch(deleteUrl, {
      method: 'GET',
    });
    const createUrl = ` https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}`;
    const response = await fetch(createUrl, {
      method: 'POST',
      body: JSON.stringify({
        button: [
          {
            name: '角色切换',
            sub_button: [
              {
                type: 'click',
                name: '教师',
                key: 'techer',
              },
              {
                type: 'click',
                name: '导游',
                key: 'guide',
              },
              {
                type: 'click',
                name: '算命先生',
                key: 'destiny',
              },
              {
                type: 'click',
                name: '客服',
                key: 'customer',
              },
            ],
          },
          {
            name: '需要帮助',
            sub_button: [
              {
                type: 'click',
                name: '使用指南',
                key: 'use',
              },
            ],
          },
        ],
      }),
    });
    if (response.status === 200) {
      const data = await response.json();
      return data;
    }
    return;
  }

  async sendCustomerMsg(msg) {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(msg),
    });
    console.log(response);
    logger.info('[Customer send:]: ' + JSON.stringify(response));
  }

  sleep() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }

  async addvoicetorecofortext(file) {
    const accessToken = await this.getAccessToken();
    const voiceId = uuidv4();
    const uploadUrl = `https://api.weixin.qq.com/cgi-bin/media/voice/addvoicetorecofortext?access_token=${accessToken}&format=mp3&voice_id=${voiceId}&lang=zh_CN`;
    const getResultUrl = `https://api.weixin.qq.com/cgi-bin/media/voice/queryrecoresultfortext?access_token=${accessToken}&voice_id=${voiceId}`;
    const form = new FormData();
    form.append('file', file);
    // 上传音频文件
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log(response);
    if (response.status === 200) {
      // await this.sleep();
      // 获取识别结果
      const resultReponse = await fetch(getResultUrl, {
        method: 'POST',
      });

      console.log(resultReponse);
      if (resultReponse.status == 200) {
        const data = await resultReponse.json();
        console.log(data);
        logger.info('[Audio reco:]: ' + JSON.stringify(data));
        return data.result;
      }
    }
    return '';
  }

  /**
   * PC端微信支付: Native支付
   */
  async createPrePayOrderForPC(req) {
    console.log(req);
    // const { goodsId } = req.body;
    // // 用goodsId去数据库查询商品信息
    // const goods = await Goods.findOne({ _id: goodsId }).lean();
    // console.log('查到数据库中的商品信息', goods);
    // if (goods) {
    //   const goodsName = goods.goodsName;
    //   const goodsPrice = goods.price;
    //   try {
    //     const orderId = uuidv4();
    //     const params = {
    //       appid: wxConfig.appid,
    //       mchid: wxConfig.mchid,
    //       description: `购买商品：${goodsName} x 1`, // 商品描述
    //       out_trade_no: orderId, // 商户订单号
    //       notify_url: 'https://www.cdyz.top/api/pay/wechat', // 通知地址，异步接收微信的回调地址
    //       amount: {
    //         total: goodsPrice, // 订单总金额，单位：分
    //         currency: 'CNY',
    //       },
    //     };
    //     const { code_url } = await wxPay.transactions_native(params);
    //     return {
    //       qrCode: code_url,
    //       orderId: orderId,
    //       total: goodsPrice,
    //     };
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }
    // return;
  }

  /**
   * 用户支付后，微信会通知商户系统
   * @returns
   */
  async handleWeixinPayMsg(req, res) {
    console.log(req, res);
    // 解密通知参数
    // const decrypted = await wxPay.decipher_gcm(
    //   req.body.resource.ciphertext,
    //   req.body.resource.associated_data,
    //   req.body.resource.nonce,
    //   apiV3Key,
    // );

    // const headers = req.headers;
    // // 获取微信发下来的签名我们需要用自己的apiv3密钥去验证的
    // const params = {
    //   body: req.body,
    //   signature: headers['wechatpay-signature'],
    //   serial: headers['wechatpay-serial'],
    //   nonce: headers['wechatpay-nonce'],
    //   timestamp: headers['wechatpay-timestamp'],
    // };
    // // 验证签名
    // const ret = await wxPay.verifySign(params);
    // if (ret) {
    //   // 处理订单逻辑
    //   console.log('支付成功！！！！');
    //   //自己数据库的更新订单状态啊什么的.....
    //   //....
    //   // 返回成功（一定要返回200）
    //   res.status(200).send('success');
    // } else {
    //   // 签名验证失败
    //   res.status(400).send('失败啦！');
    // }
  }
}

module.exports = WeixinApiUtil;
