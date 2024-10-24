const { logger } = require('~/config');
const Vip = require('~/models/Vip');
const {
  openVip,
} = require('~/models');
/**
//  * 获取用户的会员信息
//  * @param {*} req
//  * @param {*} res
//  */
const vipInfoController = async (req, res) => {
  try {
    const record = await Vip.findOne({ user: req.user.id },
      { goodsName: 1, goodsId: 1, goodsLevel: 1, expiredTime: 1 }).lean();
    res.status(200).json(record);
  } catch (err) {
    logger.error('[vipInfoController]', err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * 创建会员
 * @param {*} req
 * @param {*} res
 */
const openVipController = async (req, res) => {
  try {
    await openVip(req.body);
    res.status(200).send(true);
  } catch (err) {
    logger.error('[openVipController]', err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  vipInfoController,
  openVipController,
};

