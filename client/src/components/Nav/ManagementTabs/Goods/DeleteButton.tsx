import React, { useCallback } from 'react';
import { useDeleteGoodMutation } from '~/data-provider';
import {
  OGDialog,
  Label,
} from '~/components/ui';
import OGDialogTemplate from '~/components/ui/OGDialogTemplate';
import type { TGoods } from 'librechat-data-provider';
import { useToastContext } from '~/Providers';

type DeleteButtonProps = {
  goods?: TGoods;
  showDialog?: boolean;
  setShowDialog?: (value: boolean) => void;
  onConfirm: () => void;
};

export default function DeleteButton({
  goods,
  showDialog,
  setShowDialog,
  onConfirm,
}: DeleteButtonProps) {

  const { showToast } = useToastContext();

  const { mutate: deleteGoodsById, isLoading: isDeleting } = useDeleteGoodMutation({
    onSuccess: () => {
      showToast({ message: '删除商品成功！' });
      onConfirm();
    },
    onError: (error) => {
      console.error('Error:', error);
      showToast({ message: '删除商品失败！', status: 'error' });
    },
  });

  const confirmDelete = useCallback(() => {
    if (goods && !isDeleting) {
      deleteGoodsById(goods.id);
    }
  }, [goods]);

  const dialogContent = (
    <OGDialogTemplate
      showCloseButton={false}
      title='删除商品？'
      className="z-[1000] max-w-[450px]"
      main={
        <>
          <div className="flex w-full flex-col items-center gap-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="dialog-confirm-delete" className="text-left text-sm font-medium">
                确定要删除商品: <strong>{goods?.name}</strong>？
              </Label>
            </div>
          </div>
        </>
      }
      selection={{
        selectHandler: confirmDelete,
        selectClasses:
          'rounded-md bg-green-500 px-4 py-3 tracking-wide text-white transition-colors duration-200 hover:bg-green-550 focus:bg-green-550 focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-green-500',
        selectText: '删除',
      }}
    />
  );

  return (
    <OGDialog open={showDialog} onOpenChange={setShowDialog}>
      {dialogContent}
    </OGDialog>
  );

}
