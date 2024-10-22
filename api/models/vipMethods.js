
const Vip = require('./Vip');
// const { logger } = require('~/config');

/**
 * Open vip for a user
 * @param {Object} data - Information about the user.
 * @returns {Promise<ObjectId>} A promise that resolves to the created user document ID.
 * @throws {Error} If a user with the same user_id already exists.
 */
const openVip = async (data) => {
  const vipData = {
    ...data,
  };
  const { id, userId } = data;

  const vipInfo = {
    ...vipData,
    user: userId,
  };
  if (id) {
    // 更新 vip 信息
    const existingVip = await Vip.findOne({ _id: id });
    existingVip.set(vipInfo);
    await existingVip.save();
  } else {
    // 开通 Vip
    await Vip.create(vipInfo);
  }
};

module.exports = {
  openVip,
};
