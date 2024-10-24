const checkVip = function (req, model) {
  const { vip } = req.user;

  if (!vip) {
    return false;
  }

  const currentTime = new Date();
  const expiredTime = new Date(vip.expiredTime);

  if (currentTime > expiredTime) {
    return false;
  }

  if (model != undefined && vip.goodsLevel === '1' && model !== 'gpt-4o-mini') {
    return false;
  }

  return true;
};

module.exports = checkVip;