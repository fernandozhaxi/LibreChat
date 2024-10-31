const WeixinApiUtil = require('./WeixinApiUtil');
async function run() {
  const weixinApiUtil = new WeixinApiUtil();
  weixinApiUtil.createCustomMenus();
}

run();
