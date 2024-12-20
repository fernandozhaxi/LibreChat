class WeixinMsgUtil {
  // 事件-关注
  static EVENT_SUBSCRIBE = 'subscribe';
  static EVENT_CLICK = 'CLICK';

  /**
   * 微信消息转对象
   *
   * @param {string} xml
   * @return {ReceiveMessage}
   */
  static msgToReceiveMessage(req) {
    const jsonObject = req.body.xml;
    const receiveMessage = new ReceiveMessage();
    receiveMessage.toUserName = jsonObject.tousername?.[0] || '';
    receiveMessage.fromUserName = jsonObject.fromusername?.[0] || '';
    receiveMessage.createTime = jsonObject.createtime?.[0] || '';
    receiveMessage.msgType = jsonObject.msgtype?.[0] || '';
    receiveMessage.content = jsonObject.content?.[0] || '';
    receiveMessage.msgId = jsonObject.msgid?.[0] || '';
    receiveMessage.event = jsonObject.event?.[0] || '';
    receiveMessage.ticket = jsonObject.ticket?.[0] || '';
    receiveMessage.picUrl = jsonObject.picurl?.[0] || '';
    receiveMessage.mediaId = jsonObject.mediaid?.[0] || '';
    receiveMessage.eventKey = jsonObject.eventkey?.[0] || '';
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
  /**
   * 是否是普通消息
   *
   * @param {ReceiveMessage} receiveMessage
   * @return {boolean}
   */
  static isNormalMsg(receiveMessage) {
    return [
      'text',
      'image',
      'voice',
      'video',
      'shortvideo',
      'location',
      'link',
    ].includes(receiveMessage.msgType);
  }

  /**
   * 是否是菜单栏点击事件
   *
   * @param {ReceiveMessage} receiveMessage
   * @return {boolean}
   */
  static isMenuClickEvent(receiveMessage) {
    return receiveMessage.msgType === 'event' && receiveMessage.event === WeixinMsgUtil.EVENT_CLICK;
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
    this.eventKey = '';
    this.ticket = '';
    this.picUrl = '';
    this.mediaId = '';
  }
  getReplyTextMsg(msg) {
    const xml =
      '<xml>\n' +
      '       <ToUserName><![CDATA[' +
      this.fromUserName +
      ']]></ToUserName>\n' +
      '       <FromUserName><![CDATA[' +
      this.toUserName +
      ']]></FromUserName>\n' +
      '       <CreateTime>' +
      new Date().getTime() +
      '</CreateTime>\n' +
      '       <MsgType><![CDATA[text]]></MsgType>\n' +
      '       <Content><![CDATA[' +
      msg +
      ']]></Content>\n' +
      '     </xml>';
    return xml;
  }
  getReplyTextJsonMsg(content) {
    return {
      touser: this.fromUserName,
      msgtype: 'text',
      text: {
        content: content,
      },
    };
  }
  getReplyImageMsg(mediaId) {
    const xml =
      '<xml>\n' +
      '       <ToUserName><![CDATA[' +
      this.fromUserName +
      ']]></ToUserName>\n' +
      '       <FromUserName><![CDATA[' +
      this.toUserName +
      ']]></FromUserName>\n' +
      '       <CreateTime>' +
      new Date().getTime() +
      '</CreateTime>\n' +
      '       <MsgType><![CDATA[image]]></MsgType>\n' +
      '       <Image>' +
      '       <MediaId><![CDATA[' +
      mediaId +
      ']]></MediaId>\n' +
      '</Image>\n' +
      '     </xml>';
    return xml;
  }
}

module.exports = WeixinMsgUtil;
