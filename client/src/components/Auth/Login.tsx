import { useOutletContext } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import type { TLoginLayoutContext } from '~/common';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { getLoginError } from '~/utils';
import { useLocalize } from '~/hooks';
import LoginForm from './LoginForm';
import { isInWechatEnv, isInMiniWechatEnv } from '~/utils/wechat';
import { Button } from '../ui';
import { useState } from 'react';

function Login() {
  const localize = useLocalize();
  const { error, setError, login } = useAuthContext();
  const { startupConfig } = useOutletContext<TLoginLayoutContext>();

  const [showAccountLogin, setShowAccountLogin] = useState(false);
  const isInWechat = isInWechatEnv();
  const isInMiniWechat = isInMiniWechatEnv();

  // const handleWechatMiniLogin = () => {
  // uni.redirectTo({
  //   url: '/pages/auth/index',
  // });
  // };

  const handleWechatAuthLogin = () => {
    const url = 'https://open.weixin.qq.com/connect/oauth2/authorize?';
    const appid = 'appid=wx4cc329e7c19c2812';
    const redirect = `&redirect_uri=${encodeURIComponent('https://www.cdyz.top')}`;
    const type = '&response_type=code';
    const scope = '&scope=snsapi_userinfo';
    const state = '&state=wechat';
    const queryUrl = url + appid + type + scope + state + redirect;
    window.location.href = queryUrl + '#wechat_redirect';
  };

  return (
    <>
      {error && <ErrorMessage>{localize(getLoginError(error))}</ErrorMessage>}

      {
        isInWechat && !showAccountLogin ? <div>
          {
            // isInMiniWechat ? (<button
            //   aria-label="Sign in"
            //   data-testid="login-button"
            //   onClick={handleWechatMiniLogin}
            //   className="w-full transform rounded-md bg-green-500 px-4 py-3 tracking-wide text-white transition-colors duration-200 hover:bg-green-550 focus:bg-green-550 focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-green-500"
            // >
            //   微信小程序登录测试
            // </button>) :
            (<button
              aria-label="Sign in"
              data-testid="login-button"
              onClick={handleWechatAuthLogin}
              className="w-full transform rounded-md bg-green-500 px-4 py-3 tracking-wide text-white transition-colors duration-200 hover:bg-green-550 focus:bg-green-550 focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-green-500"
            >
              微信授权登录
            </button>)
          }
          <button
            aria-label="Sign in"
            data-testid="login-button"
            type="submit"
            onClick={() => {
              setShowAccountLogin(true);
            }}
            className="w-full mt-5 transform rounded-md bg-gray-500 px-4 py-3 tracking-wide text-white transition-colors duration-200 hover:bg-green-550 focus:bg-gray-550 focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-green-500"
          >
            账号密码登录
          </button>
        </div> :
          <>
            {(!isInWechat || showAccountLogin) && startupConfig?.emailLoginEnabled && (
              <LoginForm
                onSubmit={login}
                startupConfig={startupConfig}
                error={error}
                setError={setError}
              />
            )}
          </>
      }

      {startupConfig?.registrationEnabled && (
        <div className='flex justify-between items-center text-sm font-light text-gray-700 dark:text-white'>
          {
            isInWechat && showAccountLogin && <span aria-hidden="true" onClick={() => setShowAccountLogin(false)}>微信登录</span>
          }

          {
            <p className="my-4 text-center text-sm font-light text-gray-700 dark:text-white">
              {' '}
              {localize('com_auth_no_account')}{' '}
              <a href="/register" className="p-1 text-green-500">
                {localize('com_auth_sign_up')}
              </a>
            </p>
          }
        </div>
      )}

    </>
  );
}

export default Login;
