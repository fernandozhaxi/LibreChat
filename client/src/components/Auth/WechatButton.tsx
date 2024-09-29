import React from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useState } from 'react';
import { isInWechatEnv } from '~/utils/env';
import { Dialog, DialogContent } from '~/components/ui';
import { cn } from '~/utils/';
import { WechatIcon } from '~/components';

import { useWxQrMutation } from 'librechat-data-provider/react-query';
import type { TWxQrResponse } from 'librechat-data-provider';
import { TResError } from '~/common';

const WechatButton = ({ serverDomain, wechatAppid }) => {
  const { scanQrLogin } = useAuthContext();
  const [showPCWxLogin, setShowPCWxLogin] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [loginCheckInterval, setLoginCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const isInWechat = isInWechatEnv();

  const handleWechatAuthLogin = () => {
    const url = 'https://open.weixin.qq.com/connect/oauth2/authorize?';
    const appid = `appid=${wechatAppid}`;
    const redirect = `&redirect_uri=${encodeURIComponent(serverDomain)}`;
    const type = '&response_type=code';
    const scope = '&scope=snsapi_userinfo';
    const state = '&state=wechat';
    const queryUrl = url + appid + type + scope + state + redirect;
    console.log('serverDomain', serverDomain);
    console.log('wechatAppId', wechatAppid);

    // window.location.href = queryUrl + '#wechat_redirect';
  };

  const wxGetQr = useWxQrMutation();
  const wxQr = () => {
    wxGetQr.mutate(
      {},
      {
        onSuccess: (data: TWxQrResponse) => {
          const { code, url } = data;
          if (code && url) {
            setQrUrl(url);
            setQrLoading(false);
            setTimeout(() => {
              startTimer(code);
            }, 1000);
          }
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

  const handleRefreshQr = () => {
    if (qrLoading) { return; }
    if (loginCheckInterval) {
      clearInterval(loginCheckInterval);
      setLoginCheckInterval(null);
    }
    setQrUrl('');
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

  const handlePreWxScan = () => {
    setQrUrl('');
    setQrLoading(true);
    wxQr();
    setShowPCWxLogin(true);
  };

  const handleWxLogin = () => {
    if (isInWechat) {
      handleWechatAuthLogin();
    } else {
      handlePreWxScan();
    }
  };

  return (
    <div className="mt-2 flex gap-x-2">
      <div
        aria-label='微信'
        className="flex w-full justify-center items-center space-x-3 rounded-2xl border border-border-light bg-surface-primary px-5 py-3 text-text-primary transition-colors duration-200 hover:bg-surface-tertiary"
        data-testid='wechat'
        onClick={() => handleWxLogin()}
        style={{ cursor: 'pointer' }}
      >
        <WechatIcon />
        <p>微信登录</p>
      </div>

      {showPCWxLogin && (
        <Dialog open={showPCWxLogin} onOpenChange={(v) => { handleOpenChange(v); }}>
          <DialogContent
            className={cn('min-w-96 w-3/12 overflow-x-auto shadow-2xl dark:bg-gray-700 dark:text-white')}
          >
            <div className="overflow-x-auto p-0 text-center sm:p-6 sm:pt-4">
              <div>
                {
                  qrUrl ?
                    <img
                      style={{ height: '250px', width: '250px', margin: '40px auto 20px auto' }}
                      src={qrUrl}
                      alt=""
                      onClick={() => { handleRefreshQr(); }}
                    /> : <div className='flex justify-center items-center' style={{ background: 'white', height: '250px', width: '250px', margin: '40px auto 20px auto' }}>
                      <svg className="animate-spin -ml-1 mr-3 h-20 w-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                }
              </div>
              <div className='p-t-10 flex justify-center items-center'>
                <WechatIcon />
                <span style={{ marginLeft: '10px' }} >请使用微信扫码</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WechatButton;
