import React, { useEffect, useState } from 'react';

function Vip({ goodsList }) {
  const [selectedGoodId, setSelectedGoodId] = useState(null);
  const handleSelectGood = (id) => {
    setSelectedGoodId(id);
  };

  useEffect(() => {
    setSelectedGoodId(goodsList[0]?.id);
  }, [goodsList]);

  return (
    <div className="flex flex-col gap-3 p-1 text-sm text-text-primary">

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {goodsList.map((good, index) => (
          <div
            key={good.id}
            className={`p-4 border rounded shadow-md cursor-pointer ${selectedGoodId === good.id ? 'bg-blue-100 border-blue-500' : ''
              }`}
            onClick={() => handleSelectGood(good.id)}
          >
            <h2 style={{ fontSize: '16px' }} className="font-bold">{good.name}</h2>
            <p>价格: ￥{good.price}</p>
            <p className="line-through text-gray-400">市场价: ￥{good.marketPrice}</p>
            <div style={{ fontSize: '12px' }}>{good.desc}</div>
          </div>
        ))}
      </div>      <h2>添加客服微信开通会员</h2>
      <img
        src="https://wx2.sinaimg.cn/large/c2da5891ly8hv26ec4mmpj20n40n4win.jpg"
        alt="客服微信"
        style={{ width: '200px' }}
      />
    </div>
  );
}

export default React.memo(Vip);
