
class WeixinQrCodeCacheUtil {
  static MAX_CACHE_SIZE = 10000;
  static QR_CODE_TICKET_MAP = new Map();

  /**
   * 增加一个 Ticket
   * 首次 put：value 为 ""
   * 再次 put: value 有 openId，若openId已经存在，则已被扫码
   *
   * @param {string} key
   * @param {string} value
   */
  static put(key, value) {
    WeixinQrCodeCacheUtil.QR_CODE_TICKET_MAP.set(key, value);

    if (WeixinQrCodeCacheUtil.QR_CODE_TICKET_MAP.size > WeixinQrCodeCacheUtil.MAX_CACHE_SIZE) {
      const firstKey = WeixinQrCodeCacheUtil.QR_CODE_TICKET_MAP.keys().next().value;
      WeixinQrCodeCacheUtil.QR_CODE_TICKET_MAP.delete(firstKey);
    }
  }

  static get(key) {
    const value = WeixinQrCodeCacheUtil.QR_CODE_TICKET_MAP.get(key);
    WeixinQrCodeCacheUtil.QR_CODE_TICKET_MAP.delete(key); // remove the key after getting
    return value;
  }
}

module.exports = WeixinQrCodeCacheUtil;
