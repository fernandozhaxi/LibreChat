
const Order = require('./Order');
const { logger } = require('~/config');

/**
 * Retrieve a Goods by ID and convert the found user document to a plain object.
 *
 * @param {string} goodsId - The ID of the user to find and return as a plain object.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<MongoUser>} A plain object representing the user document, or `null` if no user is found.
 */
const getOrderById = async function (goodsId, fieldsToSelect = null) {
  const query = Order.findById(goodsId);

  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }

  return await query.lean();
};

/**
 * Search for a single goods based on partial data and return matching user document as plain object.
 * @param {Partial<MongoGoods>} searchCriteria - The partial data to use for searching the goods.
 * @param {string|string[]} [fieldsToSelect] - The fields to include or exclude in the returned document.
 * @returns {Promise<MongoOrder>} A plain object representing the user document, or `null` if no user is found.
 */
const findOrder = async function (searchCriteria, fieldsToSelect = null) {
  const query = Order.findOne(searchCriteria);
  if (fieldsToSelect) {
    query.select(fieldsToSelect);
  }

  return await query.lean();
};

/**
 * Creates a new user, optionally with a TTL of 1 week.
 * @param {MongoUser} data - The user data to be created, must contain user_id.
 * @param {boolean} [disableTTL=true] - Whether to disable the TTL. Defaults to `true`.
 * @param {boolean} [returnUser=false] - Whether to disable the TTL. Defaults to `true`.
 * @returns {Promise<ObjectId>} A promise that resolves to the created user document ID.
 * @throws {Error} If a user with the same user_id already exists.
 */
const createOrder = async (data, returnUser = false) => {
  const userData = {
    ...data,
  };

  const goods = await Order.create(userData);

  if (returnUser) {
    return goods.toObject();
  }
  return goods._id;
};

/**
 * Delete a goods by their unique ID.
 *
 * @param {string} userId - The ID of the goods to delete.
 * @returns {Promise<{ deletedCount: number }>} An object indicating the number of deleted documents.
 */
const deleteOrderById = async function (userId) {
  try {
    const result = await Order.deleteOne({ _id: userId });
    if (result.deletedCount === 0) {
      return { deletedCount: 0, message: 'No user found with that ID.' };
    }
    return { deletedCount: result.deletedCount, message: 'Goods was deleted successfully.' };
  } catch (error) {
    throw new Error('Error deleting user: ' + error.message);
  }
};

/**
 * get goods.
 *
 * @param {string} pageNumber
 * @param {string} pageSize
 * @returns {Promise<MongoUser[]>} .
 */
const getOrdersByPage = async function (pageNumber = 1, pageSize = 25, searchKey = '') {
  try {
    const filter = {
      $or: [
        { name: { $regex: searchKey, $options: 'i' } },
      ],
    };

    const totalUser = await Order.countDocuments(filter);

    const totalPages = Math.ceil(totalUser / pageSize);

    const goods = await Order.aggregate([
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
        },
      },
      {
        $skip: (pageNumber - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ]);

    return { list: goods, pages: totalPages, pageNumber, pageSize, count: totalUser };
  } catch (error) {
    logger.error('[getOrdersByPage] Error getting orders', error);
    return { message: 'Error getting orders' };
  }
};

module.exports = {
  deleteOrderById,
  getOrderById,
  createOrder,
  findOrder,
  getOrdersByPage,
};
