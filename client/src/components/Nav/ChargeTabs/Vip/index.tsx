import React from 'react';

function Vip() {
  return (
    <div className="flex flex-col gap-3 p-1 text-sm text-text-primary">
      添加客服微信开通会员
      <img
        src="/assets/kefu.jpg"
        style={{ width: '300px' }}
      />
    </div>
  );
}

export default React.memo(Vip);
