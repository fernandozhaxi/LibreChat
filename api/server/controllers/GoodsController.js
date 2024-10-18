// const { logger } = require('~/config');
const {
  getGoodsByPage,
  createGoods,
  deleteGoodsById,
  switchStatus,
} = require('~/models');

const { logger } = require('~/config');

/**
 * 根据过滤条件获取商品列表
 * @param {*} req
 * @param {*} res
 */
const getGoodsListController = async (req, res) => {
  console.log('商品列表', req.query);
  let pageNumber = req.query.pageNumber || 1;
  pageNumber = parseInt(pageNumber, 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).json({ error: 'Invalid page number' });
  }

  let pageSize = req.query.pageSize || 25;
  pageSize = parseInt(pageSize, 10);

  if (isNaN(pageSize) || pageSize < 1) {
    return res.status(400).json({ error: 'Invalid page size' });
  }

  let searchKey = req.query.searchKey;

  res.status(200).send(await getGoodsByPage(pageNumber, pageSize, searchKey));
};

/**
 * 新建商品
 * @param {*} req
 * @param {*} res
 */
const createGoodsController = async (req, res) => {
  try {
    await createGoods(req.body);
    res.status(200).send({ message: 'ok' });
  } catch (err) {
    logger.error('[createGoodsController]', err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * 删除商品
 * @param {*} req
 * @param {*} res
 */
const deleteGoodsController = async (req, res) => {
  const { id } = req.body;
  try {
    await deleteGoodsById(id);
    logger.info(`Goods deleted account. Id: ${id}`);
    res.status(200).send({ message: 'Goods deleted' });
  } catch (err) {
    logger.error('[deleteGoodsController]', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

/**
 * 切换状态
 * @param {*} req
 * @param {*} res
 */
const switchStatusController = async (req, res) => {

  const { id, status } = req.body;
  try {
    await switchStatus(id, status);
    logger.info(`Goods deleted account. Id: ${id}`);
    res.status(200).send({ message: 'Goods deleted' });
  } catch (err) {
    logger.error('[deleteGoodsController]', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};
// /**
//  * 编辑商品
//  * @param {*} req
//  * @param {*} res
//  */
// const updateGoods = async (req, res) => {

// };

module.exports = {
  getGoodsListController,
  createGoodsController,
  deleteGoodsController,
  switchStatusController,
  // updateGoods,
};

