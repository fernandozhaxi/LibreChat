
export const isInWechatEnv  = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /miniProgram/i.test(ua) || /micromessenger/i.test(ua);
};

export const isInMiniWechatEnv  = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /miniProgram/i.test(ua);
};
