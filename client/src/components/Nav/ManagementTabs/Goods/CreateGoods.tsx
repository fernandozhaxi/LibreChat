import React, { useState } from 'react';
import { useCreateGoodsMutation } from 'librechat-data-provider/react-query';
import {
  OGDialog,
} from '~/components/ui';
import { useForm } from 'react-hook-form';
import OGDialogTemplate from '~/components/ui/OGDialogTemplate';
import { useToastContext } from '~/Providers';
import type { TCreateGoods } from 'librechat-data-provider';
import { Spinner } from '~/components/svg';
import { Dropdown } from '~/components/ui';

type CreateGoodsProps = {
  showDialog?: boolean;
  setShowDialog?: (value: boolean) => void;
  onConfirm: () => void;
};

export const TypeSelector = ({
  selectedType,
  onChange,
}: {
  selectedType: string;
  onChange: (value: string) => void;
}) => {
  const options = [
    { value: 'point', label: '点数' },
    { value: 'vip', label: '会员' },
  ];

  return (
    <div className="flex items-center justify-between">
      <div>商品类型</div>

      <Dropdown
        value={selectedType}
        onChange={onChange}
        options={options}
        sizeClasses="w-[180px]"
        testId="theme-selector"
      />
    </div>
  );
};

export const VIPTypeSelector = ({
  selectedVIPType,
  onChange,
}: {
  selectedVIPType: string;
  onChange: (value: string) => void;
}) => {
  const vipOptions = [
    { value: '1', label: '黄金会员' },
    { value: '2', label: '白金会员' },
  ];

  return (
    <div className="flex items-center justify-between">
      <div>VIP类型</div>

      <Dropdown
        value={selectedVIPType}
        onChange={onChange}
        options={vipOptions}
        sizeClasses="w-[180px]"
        testId="vip-type-selector"
      />
    </div>
  );
};

export default function CreateGoods({
  showDialog,
  setShowDialog,
  onConfirm,
}: CreateGoodsProps) {

  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('vip');
  const [selectedVIPType, setSelectedVIPType] = useState('1');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TCreateGoods>({ mode: 'onChange' });

  const createGoods = useCreateGoodsMutation({
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      showToast({ message: '创建商品成功！' });
      setLoading(false);
      onConfirm();
      setShowDialog && setShowDialog(false);
    },
    onError: (error: unknown) => {
      showToast({ message: '创建商品失败！', status: 'error' });
      setLoading(false);
      onConfirm();
    },
  });

  const handleConfirm = (data: TCreateGoods) => {
    return createGoods.mutate({
      ...data,
      type: selectedType,
      level: +selectedVIPType,
      status: 1,
      points: data.points || 0,
    });
  };

  const renderInput = (id: string, label: string, type: string, validation: object) => (
    <div className="mb-2">
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={id}
          aria-label={label}
          {...register(
            id as 'name',
            validation,
          )}
          aria-invalid={!!errors[id]}
          className="webkit-dark-styles peer block w-full appearance-none rounded-md border border-gray-300 bg-transparent px-3.5 pb-3.5 pt-4 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-green-500"
          placeholder=" "
          data-testid={id}
        />
        <label
          htmlFor={id}
          className="absolute start-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-3 text-sm text-gray-500 duration-100 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-3 peer-focus:text-green-600 dark:bg-gray-900 dark:text-gray-400 dark:peer-focus:text-green-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4"
        >
          {label}
        </label>
      </div>
      {errors[id] && (
        <span role="alert" className="mt-1 text-sm text-red-500 dark:text-red-900">
          {String(errors[id]?.message) ?? ''}
        </span>
      )}
    </div>
  );

  const dialogContent = (
    <OGDialogTemplate
      showCloseButton={true}
      showCancelButton={false}
      title='创建商品'
      className="z-[1000] max-w-[650px]"
      main={
        <>
          <div className="flex w-full flex-col items-center gap-2">
            <div className="grid w-full items-center gap-2">
              <form
                className="mt-6"
                method="POST"
                onSubmit={handleSubmit(handleConfirm)}
              >
                {renderInput('name', '商品名称', 'text', {
                  required: '商品名称必填',
                  minLength: {
                    value: 3,
                    message: '商品名称最少3个字符',
                  },
                  maxLength: {
                    value: 100,
                    message: '商品名称最多100个字符',
                  },
                })}
                {renderInput('marketPrice', '市场价格', 'number', {
                  required: '市场价格必填',
                })}
                {renderInput('price', '售价', 'number', {
                  required: '售价必填',
                })}
                {renderInput('desc', '商品描述', 'text', {})}
                <TypeSelector selectedType={selectedType} onChange={setSelectedType} />
                {selectedType === 'vip' && (
                  <VIPTypeSelector selectedVIPType={selectedVIPType} onChange={setSelectedVIPType} />
                )}
                {selectedType === 'point' && renderInput('points', '点数', 'number', {
                  required: '点数必填',
                  min: {
                    value: 0,
                    message: '点数不能为负值',
                  },
                })}
                <div className="mt-6">
                  <button
                    disabled={Object.keys(errors).length > 0}
                    type="submit"
                    aria-label="Submit registration"
                    className="w-full transform rounded-md bg-green-500 px-4 py-3 tracking-wide text-white transition-colors duration-200 hover:bg-green-550 focus:bg-green-550 focus:outline-none disabled:cursor-not-allowed disabled:hover:bg-green-500"
                  >
                    {loading ? <Spinner /> : '确 认'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      }
    />
  );

  return (
    <OGDialog open={showDialog} onOpenChange={setShowDialog}>
      {dialogContent}
    </OGDialog>
  );
}
