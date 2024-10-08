import {
  useMemo,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
  createContext,
} from 'react';
import { useRecoilState } from 'recoil';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setTokenHeader, SystemRoles } from 'librechat-data-provider';
import {
  useGetUserQuery,
  useLoginUserMutation,
  useWxLoginUserMutation,
  useRefreshTokenMutation,
  useWxQrLoginMutation,
} from 'librechat-data-provider/react-query';
import type { TLoginResponse, TWxLoginUser, TLoginUser } from 'librechat-data-provider';
import { TAuthConfig, TUserContext, TAuthContext, TResError } from '~/common';
import { useLogoutUserMutation, useGetRole } from '~/data-provider';
import useTimeout from './useTimeout';
import store from '~/store';

const AuthContext = createContext<TAuthContext | undefined>(undefined);

const AuthContextProvider = ({
  authConfig,
  children,
}: {
  authConfig?: TAuthConfig;
  children: ReactNode;
}) => {
  const [user, setUser] = useRecoilState(store.user);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { data: userRole = null } = useGetRole(SystemRoles.USER, {
    enabled: !!(isAuthenticated && (user?.role ?? '')),
  });
  const { data: adminRole = null } = useGetRole(SystemRoles.ADMIN, {
    enabled: !!(isAuthenticated && user?.role === SystemRoles.ADMIN),
  });

  const navigate = useNavigate();
  const setUserContext = useCallback(
    (userContext: TUserContext) => {
      const { token, isAuthenticated, user, redirect } = userContext;
      if (user) {
        setUser(user);
      }
      setToken(token);
      //@ts-ignore - ok for token to be undefined initially
      setTokenHeader(token);
      setIsAuthenticated(isAuthenticated);
      if (redirect) {
        navigate(redirect, { replace: true });
      }
    },
    [navigate, setUser],
  );
  const doSetError = useTimeout({ callback: (error) => setError(error as string | undefined) });

  const loginUser = useLoginUserMutation();
  const logoutUser = useLogoutUserMutation({
    onSuccess: () => {
      setUserContext({
        token: undefined,
        isAuthenticated: false,
        user: undefined,
        redirect: '/login',
      });
    },
    onError: (error) => {
      doSetError((error as Error).message);
      setUserContext({
        token: undefined,
        isAuthenticated: false,
        user: undefined,
        redirect: '/login',
      });
    },
  });

  const logout = useCallback(() => logoutUser.mutate(undefined), [logoutUser]);
  const userQuery = useGetUserQuery({ enabled: !!token });
  const refreshToken = useRefreshTokenMutation();

  const login = (data: TLoginUser) => {
    loginUser.mutate(data, {
      onSuccess: (data: TLoginResponse) => {
        const { user, token } = data;
        setError(undefined);
        setUserContext({ token, isAuthenticated: true, user, redirect: '/c/new' });
      },
      onError: (error: TResError | unknown) => {
        const resError = error as TResError;
        doSetError(resError.message);
        navigate('/login', { replace: true });
      },
    });
  };

  const wxLoginUser = useWxLoginUserMutation();
  const wxLogin = (data: TWxLoginUser) => {
    return new Promise((resolve, reject) => {
      wxLoginUser.mutate(data, {
        onSuccess: (data: TLoginResponse) => {
          const { user, token } = data;
          setTimeout(() => {
            resolve(true);
            setError(undefined);
            setUserContext({ token, isAuthenticated: true, user, redirect: '/c/new' });
          }, 1000);
        },
        onError: (error: TResError | unknown) => {
          reject(false);
          setTimeout(() => {
            const resError = error as TResError;
            doSetError(resError.message);
            navigate('/login', { replace: true });
          }, 1000);
        },
      });
    });
  };

  const wxQrLogin = useWxQrLoginMutation();
  const scanQrLogin = (data: TWxLoginUser): Promise<string> => {
    return new Promise((resolve) => {
      wxQrLogin.mutate(data, {
        onSuccess: (data: TLoginResponse) => {
          const { user, token } = data;
          if (token && user) {
            resolve(token);
            setTimeout(() => {
              setError(undefined);
              setUserContext({ token, isAuthenticated: true, user, redirect: '/c/new' });
            }, 500);
          } else {
            resolve('');
          }
        },
        onError: (error: TResError | unknown) => {
          resolve('');
        },
      });
    });
  };

  const silentRefresh = useCallback(() => {
    if (authConfig?.test) {
      console.log('Test mode. Skipping silent refresh.');
      return;
    }
    refreshToken.mutate(undefined, {
      onSuccess: (data: TLoginResponse) => {
        const { user, token } = data;
        if (token) {
          setUserContext({ token, isAuthenticated: true, user });
        } else {
          console.log('Token is not present. User is not authenticated.');
          if (authConfig?.test) {
            return;
          }
          navigate('/login');
        }
      },
      onError: (error) => {
        console.log('refreshToken mutation error:', error);
        if (authConfig?.test) {
          return;
        }
        navigate('/login');
      },
    });
  }, []);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (userQuery.data) {
      setUser(userQuery.data);
    } else if (userQuery.isError) {
      doSetError((userQuery.error as Error).message);
      navigate('/login', { replace: true });
    }
    if (error && isAuthenticated) {
      doSetError(undefined);
    }
    if (!token || !isAuthenticated) {
      // 小程序登录逻辑
      const state = searchParams.get('state');
      const token = searchParams.get('token');
      const refresh_token = searchParams.get('refresh_token');
      const code = searchParams.get('code');
      const isFromWechat = state === 'wechat';
      if (isFromWechat) {
        if (token && refresh_token) {
          window.localStorage.setItem('refresh_token', refresh_token);
          setUserContext({ token, isAuthenticated: true, redirect: '/c/new' });
        } else if (code) {
          // If code exists in the url, is Wechat web
          wxLogin({
            code,
          });
        } else {
          silentRefresh();
        }
      } else {
        silentRefresh();
      }
    }
  }, [
    token,
    isAuthenticated,
    userQuery.data,
    userQuery.isError,
    userQuery.error,
    error,
    navigate,
    setUserContext,
  ]);

  useEffect(() => {
    const handleTokenUpdate = (event) => {
      console.log('tokenUpdated event received event');
      const newToken = event.detail;
      setUserContext({
        token: newToken,
        isAuthenticated: true,
        user: user,
      });
    };

    window.addEventListener('tokenUpdated', handleTokenUpdate);

    return () => {
      window.removeEventListener('tokenUpdated', handleTokenUpdate);
    };
  }, [setUserContext, user]);

  // Make the provider update only when it should
  const memoedValue = useMemo(
    () => ({
      user,
      token,
      error,
      login,
      logout,
      scanQrLogin,
      setError,
      roles: {
        [SystemRoles.USER]: userRole,
        [SystemRoles.ADMIN]: adminRole,
      },
      isAuthenticated,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, error, isAuthenticated, token, userRole, adminRole],
  );

  return <AuthContext.Provider value={memoedValue}>{children}</AuthContext.Provider>;
};

const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext should be used inside AuthProvider');
  }

  return context;
};

export { AuthContextProvider, useAuthContext };
