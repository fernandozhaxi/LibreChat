const mongoose = require('mongoose');
const goodsSchema = require('~/models/schema/goodsSchema');

const Goods = mongoose.model('Goods', goodsSchema);

module.exports = Goods;
