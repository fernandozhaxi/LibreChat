const checkVip = function (req, model) {
  if (!req.user?.vip) {
    return false;
  }

  const { vip } = req.user;
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
