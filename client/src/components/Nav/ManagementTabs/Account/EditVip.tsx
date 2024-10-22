import React, { useState, useEffect } from 'react';
import { useOpenVipMutation } from '~/data-provider';
import { OGDialog, Dropdown } from '~/components/ui';
import OGDialogTemplate from '~/components/ui/OGDialogTemplate';
import type { TUser } from 'librechat-data-provider';
import { useToastContext } from '~/Providers';
import { useGetGoodsQuery } from '~/data-provider';
import { TGoods } from 'librechat-data-provider';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type EditVipProps = {
  user?: TUser;
  className?: string;
  showDialog?: boolean;
  setShowDialog?: (value: boolean) => void;
  onConfirm: () => void;
};

export default function EditVip({
  user,
  showDialog,
  setShowDialog,
  onConfirm,
}: EditVipProps) {
  const { showToast } = useToastContext();
  const [goodsId, setGoodsId] = useState<string>('');
  const [goodsName, setGoodsName] = useState<string>('');
  const [goodsLevel, setGoodsLevel] = useState<number>(0);
  const [userId, setUserId] = useState<string>('');
  const [recordId, setRecordId] = useState<string | undefined>();
  const [expiredTime, setExpiredTime] = useState<Date | null>(null);

  useEffect(() => {
    const vip = user?.vip;
    if (vip?.goodsId) {
      setRecordId(vip.id);
      setGoodsId(vip.goodsId);
      setGoodsName(vip.goodsName);
      setGoodsLevel(vip.goodsLevel);
      setExpiredTime(vip.expiredTime);
    }
    setUserId(user?.id || '');
    // 请求会员列表
    refetch();
  }, [user]);

  const { data: { list: vipList = [] } = {}, refetch } =
    useGetGoodsQuery({
      pageNumber: 1,
      pageSize: 100,
      type: 'vip',
      searchKey: '',
    });

  const { mutate: openVip, isLoading: isLoading } = useOpenVipMutation({
    onSuccess: () => {
      showToast({ message: '更新会员信息成功！' });
      onConfirm();
    },
    onError: (error) => {
      console.error('Error:', error);
      showToast({ message: '更新会员信息失败！', status: 'error' });
    },
  });

  const handleVipChange = (v) => {
    const target = vipList.find(i => i.id === v);
    if (target) {
      setGoodsId(target.id);
      setGoodsName(target.name);
      setGoodsLevel(target.level);
    }
  };

  const handleExpiredTimeChange = (date) => {
    setExpiredTime(date);
  };

  const handleConfirm = () => {
    if (!isLoading && goodsId && expiredTime) {
      openVip({
        id: recordId,
        userId: userId,
        goodsId: goodsId,
        goodsName: goodsName,
        goodsLevel: goodsLevel,
        expiredTime: expiredTime,
      });
    }
  };

  console.log(goodsId);

  const dialogContent = (
    <OGDialogTemplate
      showCloseButton={false}
      title={goodsId ? '编辑会员' : '开通会员'}
      className="z-[1000] max-w-[500px]"
      main={
        <>
          <div className="flex w-full flex-col items-center gap-2">
            <div className="grid w-full items-center gap-2">
              <div className="flex mt-5">
                用户名：{user?.name || ''}
              </div>
              <div className="flex items-center">
                会员级别： <Dropdown
                  value={goodsId}
                  onChange={handleVipChange}
                  options={vipList.map((i: TGoods) => {
                    return {
                      value: i.id,
                      label: i.name,
                    };
                  })}
                  sizeClasses="w-[200px]"
                />
              </div>
              <div>
                到期时间：
                <DatePicker
                  selected={expiredTime}
                  onChange={handleExpiredTimeChange}
                  placeholderText="到期时间"
                  className="border rounded p-2"
                />
              </div>
            </div>
          </div>
        </>
      }
      selection={{
        selectHandler: handleConfirm,
        selectClasses:
          'rounded-md bg-green-500 px-4 py-3 tracking-wide text-white transition-colors duration-200 hover:bg-green-550 focus:bg-green-550 focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-green-500',
        selectText: '确定',
      }}
    />
  );

  return (
    <OGDialog open={showDialog} onOpenChange={setShowDialog}>
      {dialogContent}
    </OGDialog>
  );
}
