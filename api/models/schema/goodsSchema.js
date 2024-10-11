const mongoose = require('mongoose');

const goodsSchema = mongoose.Schema(
  {
    name: { // 商品名称
      type: String,
      required: true,
    },
    price: { // 售价, 单位为分
      type: Number,
      required: true,
    },
    type: { // 类型，vip/point
      type: String,
      required: true,
    },
    marketPrice: { // 市场价, 单位为分
      type: Number,
      required: true,
    },
    desc: { // 商品描述
      type: String,
    },
    count: { // 数量，vip表示月份，point表示积分数量
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = goodsSchema;
