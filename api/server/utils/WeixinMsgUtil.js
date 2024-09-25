// const parseString = require('xml2js').parseString;

class WeixinMsgUtil {
  // 事件-关注
  static EVENT_SUBSCRIBE = 'subscribe';

  /**
   * 微信消息转对象
   *
   * @param {string} xml
   * @return {ReceiveMessage}
   */
  static async msgToReceiveMessage(req) {
    const str = req.body.toString('utf8');
    const jsonObject = JSON.parse(str);
    // const jsonObject = await parseString(xml);
    console.log(jsonObject);
    const receiveMessage = new ReceiveMessage();
    receiveMessage.toUserName = jsonObject.ToUserName;
    receiveMessage.fromUserName = jsonObject.FromUserName;
    receiveMessage.createTime = jsonObject.CreateTime;
    receiveMessage.msgType = jsonObject.MsgType;
    receiveMessage.content = jsonObject.Content;
    receiveMessage.msgId = jsonObject.MsgId;
    receiveMessage.event = jsonObject.Event;
    receiveMessage.ticket = jsonObject.Ticket;
    return receiveMessage;
  }

  /**
   * 是否是订阅事件
   *
   * @param {ReceiveMessage} receiveMessage
   * @return {boolean}
   */
  static isEventAndSubscribe(receiveMessage) {
    return receiveMessage.event === WeixinMsgUtil.EVENT_SUBSCRIBE;
  }

  /**
   * 是否是二维码扫描事件
   *
   * @param {ReceiveMessage} receiveMessage
   * @return {boolean}
   */
  static isScanQrCode(receiveMessage) {
    return receiveMessage.ticket !== undefined && receiveMessage.ticket !== '';
  }

  /**
   * 获取扫描的二维码 Ticket
   *
   * @param {ReceiveMessage} receiveMessage
   * @return {string}
   */
  static getQrCodeTicket(receiveMessage) {
    return receiveMessage.ticket;
  }

}

class ReceiveMessage {
  constructor() {
    this.toUserName = '';
    this.fromUserName = '';
    this.createTime = '';
    this.msgType = '';
    this.content = '';
    this.msgId = '';
    this.event = '';
    this.ticket = '';
  }
  getReplyTextMsg(msg) {
    const xml = '<xml>\n'
      + '       <ToUserName><![CDATA[' + this.fromUserName + ']]></ToUserName>\n'
      + '       <FromUserName><![CDATA[' + this.toUserName + ']]></FromUserName>\n'
      + '       <CreateTime>' + new Date().getTime() + '</CreateTime>\n'
      + '       <MsgType><![CDATA[text]]></MsgType>\n'
      + '       <Content><![CDATA[' + msg + ']]></Content>\n'
      + '     </xml>';
    return xml;
  }
}

module.exports = WeixinMsgUtil;
