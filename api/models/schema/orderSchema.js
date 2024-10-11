const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: { // 付款人
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    total: { // 总价
      type: Number,
      required: true,
    },
    goodsId: { // 商品Id
      type: String,
      required: true,
    },
    goodsName: { // 商品名称
      type: String,
      required: true,
    },
    goodsNum: { // 商品数量
      type: Number,
      required: true,
    },
    goodsType: { // 商品类型：vip/point
      type: String,
      required: true,
    },
    status: { // 支付状态：0待支付，1已完成，2已关闭，3退款中，4已退款
      type: String,
      required: true,
    },
    payType: { // 支付方式； wechat
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = orderSchema;
