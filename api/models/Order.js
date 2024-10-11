const mongoose = require('mongoose');
const orderSchema = require('~/models/schema/orderSchema');

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
