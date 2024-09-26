import { useOutletContext } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import type { TLoginLayoutContext } from '~/common';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { getLoginError } from '~/utils';
import { useLocalize } from '~/hooks';
import LoginForm from './LoginForm';
import { isInWechatEnv, isInPcDevice } from '~/utils/env';
import { Dialog, DialogContent } from '~/components/ui';
import { useState } from 'react';
import { cn } from '~/utils/';

import { useWxQrMutation } from 'librechat-data-provider/react-query';
import type { TWxQrResponse } from 'librechat-data-provider';
import { TResError } from '~/common';

function Login() {
  const localize = useLocalize();
  const { error, setError, login, scanQrLogin } = useAuthContext();
  const { startupConfig } = useOutletContext<TLoginLayoutContext>();

  const [showAccountLogin, setShowAccountLogin] = useState(false);
  const [showPCWxLogin, setShowPCWxLogin] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [loginCheckInterval, setLoginCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const isInWechat = isInWechatEnv();
  const isPc = isInPcDevice();

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

  const wxGetQr = useWxQrMutation();
  const wxQr = () => {
    wxGetQr.mutate(
      {},
      {
        onSuccess: (data: TWxQrResponse) => {
          const { code, url } = data;
          setQrUrl(url);
          setQrLoading(false);
          setTimeout(() => {
            startTimer(code);
          }, 1000);
        },
        onError: (error: TResError | unknown) => {
          console.log(error);
        },
      },
    );
  };

  const startTimer = (code: string) => {
    if (loginCheckInterval) {
      clearInterval(loginCheckInterval);
      setLoginCheckInterval(null);
    }

    const intervalId = setInterval(async () => {
      const token = await scanQrLogin({ code });
      if (token) {
        clearInterval(intervalId);
        setLoginCheckInterval(null);
      }
    }, 3000);

    setLoginCheckInterval(intervalId);
  };

  const handlePreWxScan = () => {
    setQrUrl('');
    setQrLoading(true);
    wxQr();
    setShowPCWxLogin(true);
  };

  const handleRereshQr = () => {
    if (qrLoading) { return; }
    if (loginCheckInterval) {
      clearInterval(loginCheckInterval);
      setLoginCheckInterval(null);
    }
    setQrLoading(true);
    wxQr();
  };

  const handleOpenChange = (v) => {
    setShowPCWxLogin(v);
    if (loginCheckInterval) {
      clearInterval(loginCheckInterval);
      setLoginCheckInterval(null);
    }
  };

  return (
    <>
      {error && <ErrorMessage>{localize(getLoginError(error))}</ErrorMessage>}

      {isInWechat && !showAccountLogin ? (
        <div>
          <button
            aria-label="Sign in"
            data-testid="login-button"
            onClick={handleWechatAuthLogin}
            className="w-full transform rounded-md bg-green-500 px-4 py-3 tracking-wide text-white transition-colors duration-200 hover:bg-green-550 focus:bg-green-550 focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-green-500"
          >
            微信授权登录
          </button>
          <button
            aria-label="Sign in"
            data-testid="login-button"
            type="submit"
            onClick={() => {
              setShowAccountLogin(true);
            }}
            className="focus:bg-gray-550 mt-5 w-full transform rounded-md bg-gray-500 px-4 py-3 tracking-wide text-white transition-colors duration-200 hover:bg-green-550 focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-green-500"
          >
            账号密码登录
          </button>
        </div>
      ) : (
        <>
          {isPc ? (
            <div>
              {startupConfig?.emailLoginEnabled && (
                <LoginForm
                  onSubmit={login}
                  startupConfig={startupConfig}
                  error={error}
                  setError={setError}
                />
              )}
            </div>
          ) : (
            <div>
              {startupConfig?.emailLoginEnabled && (
                <LoginForm
                  onSubmit={login}
                  startupConfig={startupConfig}
                  error={error}
                  setError={setError}
                />
              )}
            </div>
          )}
        </>
      )}

      {startupConfig?.registrationEnabled && (
        <div className="flex items-center justify-between text-sm font-light text-gray-700 dark:text-white">
          <div>
            {isInWechat && showAccountLogin && (
              <span aria-hidden="true" onClick={() => setShowAccountLogin(false)}>
                微信登录
              </span>
            )}

            {isPc && (
              <span aria-hidden="true" onClick={() => handlePreWxScan()}>
                微信扫码登录
              </span>
            )}
          </div>

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
      {showPCWxLogin && (
        <Dialog open={showPCWxLogin} onOpenChange={(v) => { handleOpenChange(v); }}>
          <DialogContent
            className={cn('w-3/12 overflow-x-auto shadow-2xl dark:bg-gray-700 dark:text-white')}
          >
            <div className="overflow-x-auto p-0 text-center sm:p-6 sm:pt-4">
              <div>
                {
                  qrUrl ?
                    <img
                      style={{ height: '250px', width: '250px', margin: '40px auto 20px auto' }}
                      src={qrUrl}
                      alt=""
                      onClick={() => { handleRereshQr(); }}
                    /> : <div className='flex justify-center items-center' style={{ background: 'white', height: '250px', width: '250px', margin: '40px auto 20px auto' }}>
                      <svg className="animate-spin -ml-1 mr-3 h-20 w-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                }
              </div>
              <div className='p-t-10'>请使用微信扫码</div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default Login;

