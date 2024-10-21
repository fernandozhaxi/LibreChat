import React, { useCallback } from 'react';
import { useSwitchGoodsStatusMutation } from '~/data-provider';
import {
  OGDialog,
  Label,
} from '~/components/ui';
import OGDialogTemplate from '~/components/ui/OGDialogTemplate';
import type { TGoods } from 'librechat-data-provider';
import { useToastContext } from '~/Providers';

type SwichStatusProps = {
  goods?: TGoods;
  showDialog?: boolean;
  setShowDialog?: (value: boolean) => void;
  onConfirm: () => void;
};

export default function SwichStatus({
  goods,
  showDialog,
  setShowDialog,
  onConfirm,
}: SwichStatusProps) {

  const { showToast } = useToastContext();

  const { mutate: switchStatus, isLoading: isDeleting } = useSwitchGoodsStatusMutation({
    onSuccess: () => {
      showToast({ message: '切换商品状态成功！' });
      onConfirm();
    },
    onError: (error) => {
      console.error('Error:', error);
      showToast({ message: '切换商品状态失败！', status: 'error' });
    },
  });

  const confirmDelete = useCallback(() => {
    if (goods && !isDeleting) {
      switchStatus({
        id: goods.id,
        status: goods.status === 1 ? 2 : 1,
      });
    }
  }, [goods]);

  const dialogContent = (
    <OGDialogTemplate
      showCloseButton={false}
      title='切换商品状态'
      className="z-[1000] max-w-[450px]"
      main={
        <>
          <div className="flex w-full flex-col items-center gap-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="dialog-confirm-delete" className="text-left text-sm font-medium">
                确定要{goods?.status == 2 ? '启用' : '禁用'}商品: <strong>{goods?.name}</strong>？
              </Label>
            </div>
          </div>
        </>
      }
      selection={{
        selectHandler: confirmDelete,
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
