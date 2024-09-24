
export const isInWechatEnv  = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /miniProgram/i.test(ua) || /micromessenger/i.test(ua);
};

export const isInMiniWechatEnv  = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /miniProgram/i.test(ua);
};

export const isInPcDevice  = () => {
  const ua = window.navigator.userAgent;
  return !(/Mobi|Android|iPhone/i.test(ua) && isInWechatEnv);
};
