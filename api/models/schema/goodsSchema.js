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
    points: { // 数量，point 类型需要有积分数量
      type: Number,
    },
    level: { // 等级，1,2,3,4,5 vip需要有等级
      type: Number,
      required: true,
    },
    status: { // 状态，1启用 2禁用
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = goodsSchema;
