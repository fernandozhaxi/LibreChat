const { logger } = require('~/config');
const {
  openVip,
} = require('~/models');
/**
//  * 根据条件获取订单列表
//  * @param {*} req
//  * @param {*} res
//  */
// const getListController = async (req, res) => {

// };

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
  // getListController,
  openVipController,
};

