const mongoose = require('mongoose');
const vipSchema = require('~/models/schema/vipSchema');

const Vip = mongoose.model('Vip', vipSchema);

module.exports = Vip;
