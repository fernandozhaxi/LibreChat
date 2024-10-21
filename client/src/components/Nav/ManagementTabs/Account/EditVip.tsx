import React, { useState, useEffect } from 'react';
import { useUpdateVipMutation } from '~/data-provider';
import { OGDialog, Input } from '~/components/ui';
import OGDialogTemplate from '~/components/ui/OGDialogTemplate';
import type { TUser } from 'librechat-data-provider';
import { useToastContext } from '~/Providers';

type EditVipProps = {
  user: TUser;
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
  const [newVip, setNewVip] = useState<{
    userId: string,
    goodsId: string,
    startTime: number,
    endTime: number,
  }>({});

  useEffect(() => {
    const vip = user.vip;
    setNewVip({
      goodsId: vip?.goodsId,
      userId: vip?.userId,
      startTime: vip?.startTime,
      endTime: vip?.endTime,
    });
    // 请求会员列表
  }, [user]);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = Number(e.target.value);
    setNewVip(number);
  };

  const { mutate: updateVip, isLoading: isLoading } = useUpdateVipMutation({
    onSuccess: () => {
      showToast({ message: '更新会员成功！' });
      onConfirm();
    },
    onError: (error) => {
      console.error('Error:', error);
      showToast({ message: '更新会员失败！', status: 'error' });
    },
  });

  const handleConfirm = () => {
    if (!isLoading) {
      if (user.tokenCredits !== undefined && user.tokenCredits !== newValue) {
        updateVip({
          userId: newVip.userId,
          goodsId: newVip.goodsId,
          startTime: newVip.startTime,
          endTime: newVip.endTime,
        });
      } else {
        console.log('不用更新');
      }
    }
  };

  const dialogContent = (
    <OGDialogTemplate
      showCloseButton={false}
      title="编辑会员"
      className="z-[1000] max-w-[450px]"
      main={
        <>
          <div className="flex w-full flex-col items-center gap-2">
            <div className="grid w-full items-center gap-2">
              <div className=" items-center">
                <Input
                  value={(newBalance as number | undefined) ?? ''}
                  onChange={handleBalanceChange}
                  className="flex h-10 max-h-10 resize-none px-3 py-2"
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
        selectText: '保存',
      }}
    />
  );

  return (
    <OGDialog open={showDialog} onOpenChange={setShowDialog}>
      {dialogContent}
    </OGDialog>
  );
}
