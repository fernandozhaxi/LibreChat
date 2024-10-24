import { useRecoilState } from 'recoil';
import * as Select from '@ariakit/react/select';
import { Fragment, useState, memo } from 'react';
import { FileText, LogOut } from 'lucide-react';
import { useGetUserBalance, useGetUserVip, useGetStartupConfig } from 'librechat-data-provider/react-query';
import { LinkIcon, GearIcon, DropdownMenuSeparator } from '~/components';
import FilesView from '~/components/Chat/Input/Files/FilesView';
import { useAuthContext } from '~/hooks/AuthContext';
import useAvatar from '~/hooks/Messages/useAvatar';
import { UserIcon } from '~/components/svg';
import { useLocalize } from '~/hooks';
import Management from './Management';
import ChargeDialog from './ChargeDialog';
import Settings from './Settings';
import store from '~/store';
import { SystemRoles } from 'librechat-data-provider';
import { formatDateYear } from '~/utils';

function AccountSettings() {
  const localize = useLocalize();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const balanceQuery = useGetUserBalance({
    enabled: !!isAuthenticated && startupConfig?.checkBalance,
  });
  const vipQuery = useGetUserVip({
    enabled: !!isAuthenticated,
  });
  const [showManagement, setShowManagement] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCharge, setshowCharge] = useState(false);
  const [chargeType, setChargeType] = useState('');
  const [showFiles, setShowFiles] = useRecoilState(store.showFiles);

  const avatarSrc = useAvatar(user);
  const name = user?.avatar ?? user?.username ?? '';

  const handleCharge = (type) => {
    setChargeType(type);
    setshowCharge(true);
  };

  console.log('vipQuery', vipQuery);
  return (
    <Select.SelectProvider>
      <Select.Select
        aria-label={localize('com_nav_account_settings')}
        data-testid="nav-user"
        className="duration-350 mt-text-sm flex h-auto w-full items-center gap-2 rounded-xl p-2 text-sm transition-all duration-200 ease-in-out hover:bg-accent"
      >
        <div className="-ml-0.9 -mt-0.8 h-8 w-8 flex-shrink-0">
          <div className="relative flex">
            {name.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'rgb(121, 137, 255)',
                  width: '32px',
                  height: '32px',
                  boxShadow: 'rgba(240, 246, 252, 0.1) 0px 0px 0px 1px',
                }}
                className="relative flex items-center justify-center rounded-full p-1 text-text-primary"
                aria-hidden="true"
              >
                <UserIcon />
              </div>
            ) : (
              <img
                className="rounded-full"
                src={user?.avatar ?? avatarSrc}
                alt={`${name}'s avatar`}
              />
            )}
          </div>
        </div>
        <div
          className="mt-2 grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-text-primary"
          style={{ marginTop: '0', marginLeft: '0' }}
        >
          {user?.name ?? user?.username ?? localize('com_nav_user')}
        </div>
      </Select.Select>
      <Select.SelectPopover
        className="popover-ui w-[235px]"
        style={{
          transformOrigin: 'bottom',
          marginRight: '0px',
          translate: '0px',
        }}
      >
        <div className="text-token-text-secondary py-2 text-sm" role="note">
          {user?.email ?? localize('com_nav_user')}
        </div>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between">
          {startupConfig?.checkBalance === true &&
            balanceQuery.data != null &&
            !isNaN(parseInt(balanceQuery.data)) && (
            <div className="text-token-text-secondary ml-3  py-2 text-sm" role="note">
              {`积分余额: ${parseInt(balanceQuery.data)}`}
              <button
                onClick={() => { handleCharge('point'); }}
                style={{
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  marginLeft: '10px',
                }}
              >
                  充值
              </button>
            </div>
          )
          }
        </div>

        <div className="text-token-text-secondary py-2 text-sm" role="note">
          {vipQuery.data && (
            <div className='ml-3'>
              <span>{vipQuery.data.goodsName}</span>
              {new Date(vipQuery.data.expiredTime) < new Date() ? <span><span className="ml-1" style={{ color: 'red', fontSize: '11px' }}>(已过期)</span>
                <span className='ml-2' style={{ color: 'blue', cursor: 'pointer' }} onClick={() => { handleCharge('vip'); }}>续费</span></span> : <span className='ml-2'>{formatDateYear(vipQuery.data.expiredTime)}</span>}
            </div>
          )}

          {!vipQuery.data && (
            <div className="flex justify-between items-center p-2" style={{ background: 'linear-gradient(to left, orange, white)', fontSize: '13px' }}>
              <div>
                <div style={{ flex: '1', textAlign: 'left', fontSize: '16px' }}>VIP会员</div>  <div>高速通道 无限对话</div>
              </div>
              <button
                onClick={() => { handleCharge('vip'); }}
                style={{
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                立即开通
              </button>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <Select.SelectItem
          value=""
          onClick={() => setShowFiles(true)}
          className="select-item text-sm"
        >
          <FileText className="icon-md" aria-hidden="true" />
          {localize('com_nav_my_files')}
        </Select.SelectItem>
        {startupConfig?.helpAndFaqURL !== '/' && (
          <Select.SelectItem
            value=""
            onClick={() => window.open(startupConfig?.helpAndFaqURL, '_blank')}
            className="select-item text-sm"
          >
            <LinkIcon aria-hidden="true" />
            {localize('com_nav_help_faq')}
          </Select.SelectItem>
        )}
        {
          user?.role === SystemRoles.ADMIN && (
            <>
              <Select.SelectItem
                value=""
                onClick={() => setShowSettings(true)}
                className="select-item text-sm"
              >
                <GearIcon className="icon-md" aria-hidden="true" />
                {localize('com_nav_settings')}
              </Select.SelectItem>

              <Select.SelectItem
                onClick={() => setShowManagement(true)}
                className="select-item text-sm"
              >
                <FileText className="icon-md" aria-hidden="true" />
                管理
              </Select.SelectItem>
            </>
          )
        }
        <DropdownMenuSeparator />
        <Select.SelectItem
          aria-selected={true}
          onClick={() => logout()}
          value="logout"
          className="select-item text-sm"
        >
          <LogOut className="icon-md" />
          {localize('com_nav_log_out')}
        </Select.SelectItem>
      </Select.SelectPopover>
      {showFiles && <FilesView open={showFiles} onOpenChange={setShowFiles} />}
      {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} />}
      {showCharge && <ChargeDialog type={chargeType} open={showCharge} onOpenChange={setshowCharge} />}
      {showManagement && <Management open={showManagement} onOpenChange={setShowManagement} />}
    </Select.SelectProvider>
  );
}

export default memo(AccountSettings);
