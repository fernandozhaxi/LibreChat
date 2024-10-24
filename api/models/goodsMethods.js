
const Goods = require('./Goods');
const { logger } = require('~/config');

/**
 * Retrieve a Goods by ID and convert the found user document to a plain object.
 *
 * @param {string} goodsId - The ID of the user to find and return as a plain object.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<MongoUser>} A plain object representing the user document, or `null` if no user is found.
 */
const getGoodsById = async function (goodsId, fieldsToSelect = null) {
  const query = Goods.findById(goodsId);

  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }

  return await query.lean();
};

/**
 * Search for a single goods based on partial data and return matching user document as plain object.
 * @param {Partial<MongoGoods>} searchCriteria - The partial data to use for searching the goods.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<MongoUser>} A plain object representing the user document, or `null` if no user is found.
 */
const findGoods = async function (searchCriteria, fieldsToSelect = null) {
  const query = Goods.findOne(searchCriteria);
  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }

  return await query.lean();
};

/**
 * Update a user with new data without overwriting existing properties.
 *
 * @param {string} goodsId - The ID of the goods to update.
 * @param {Object} updateData - An object containing the properties to update.
 * @returns {Promise<MongoUser>} The updated user document as a plain object, or `null` if no user is found.
 */
const updateGoods = async function (goodsId, updateData) {
  const updateOperation = {
    $set: updateData,
  };
  return await Goods.findByIdAndUpdate(goodsId, updateOperation, {
    new: true,
    runValidators: true,
  }).lean();
};

/**
 * Creates a new goods
 * @param {MongoUser} data - The user data to be created, must contain user_id.
 * @param {boolean} [returnGoods=false] - Whether to disable the TTL. Defaults to `true`.
 * @returns {Promise<ObjectId>} A promise that resolves to the created user document ID.
 * @throws {Error} If a user with the same user_id already exists.
 */
const createGoods = async (data, returnGoods = false) => {
  const goods = await Goods.create(data);

  if (returnGoods) {
    return goods.toObject();
  }
  return goods._id;
};

/**
 * Count the number of goods documents in the collection based on the provided filter.
 *
 * @param {Object} [filter={}] - The filter to apply when counting the documents.
 * @returns {Promise<number>} The count of documents that match the filter.
 */
const countGoods = async function (filter = {}) {
  return await Goods.countDocuments(filter);
};

/**
 * Delete a goods by their unique ID.
 *
 * @param {string} goodsId - The ID of the goods to delete.
 * @returns {Promise<{ deletedCount: number }>} An object indicating the number of deleted documents.
 */
const deleteGoodsById = async function (goodsId) {
  try {
    const result = await Goods.deleteOne({ _id: goodsId });
    if (result.deletedCount === 0) {
      return { deletedCount: 0, message: 'No user found with that ID.' };
    }
    return { deletedCount: result.deletedCount, message: 'Goods was deleted successfully.' };
  } catch (error) {
    throw new Error('Error deleting user: ' + error.message);
  }
};

/**
 * Switch goods status by their unique ID.
 *
 * @param {string} userId - The ID of the goods to delete.
 * @returns {Promise<{ deletedCount: number }>} An object indicating the number of deleted documents.
 */
const switchGoodsStatus = async function (goodsId, status) {
  try {
    await Goods.updateOne({
      _id: goodsId,
    }, {
      $set: {
        status: status,
      },
    }, { upsert: true });

    return { message: 'Switch goods status successfully.' };
  } catch (error) {
    throw new Error('Error deleting user: ' + error.message);
  }
};

/**
 * get goods.
 *
 * @param {string} pageNumber
 * @param {string} pageSize
 * @param {string} searchKey
 * @param {string} type
 * @returns {Promise<MongoUser[]>} .
 */
const getGoodsByPage = async function (pageNumber = 1, pageSize = 25, searchKey = '', type = '') {
  try {
    const filter = {
      $or: [
        { name: { $regex: searchKey, $options: 'i' } },
      ],
    };
    if (type) {
      filter.type = type;
    }

    const total = await Goods.countDocuments(filter);

    const totalPages = Math.ceil(total / pageSize);

    const goods = await Goods.aggregate([
      {
        $match: filter,
      },
      {
        $project: {
          id: '$_id',
          name: 1,
          marketPrice: 1,
          price: 1,
          type: 1,
          points: 1,
          status: 1,
          level: 1,
          desc: 1,
        },
      },
      {
        $skip: (pageNumber - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ]);

    return { list: goods, pages: totalPages, pageNumber, pageSize, count: total };
  } catch (error) {
    logger.error('[getGoodsByPage] Error getting goods', error);
    return { message: 'Error getting goods' };
  }
};

module.exports = {
  deleteGoodsById,
  getGoodsById,
  countGoods,
  createGoods,
  updateGoods,
  findGoods,
  getGoodsByPage,
  switchGoodsStatus,
};
