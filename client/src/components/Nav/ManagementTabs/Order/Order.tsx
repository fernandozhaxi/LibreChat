import React, { useEffect, useState } from 'react';
import { useGetOrdersQuery } from '~/data-provider';
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui';
import { NewChatIcon } from '~/components/svg';
import { formatDate } from '~/utils';
import { TUser } from 'librechat-data-provider';
import useLocalize from '~/hooks/useLocalize';

export default function Order() {
  const localize = useLocalize();

  const [currentPage, setCurrentPage] = useState(1);
  const [currentGoods, setCurrentGoods] = useState<TUser | undefined>(undefined);

  const [searchKey, setSearchKey] = useState('');
  const pageSize = 10; // 每页的用户数

  const { data: { list: users = [], pages = 0, count: totalUsers = 0 } = {}, refetch } =
    useGetOrdersQuery({
      pageNumber: currentPage,
      pageSize: pageSize,
      searchKey: searchKey,
    });

  useEffect(() => {
    refetch();
  }, [currentPage, searchKey, refetch]);

  const handleSearchKeyChange = (e) => {
    setCurrentPage(1);
    setSearchKey(e.target.value);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const handleNextPage = () => {
    if (currentPage < Number(pages)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const haldlePreDisabledUser = (user) => {
    setCurrentGoods(user);
  };
  const handlePreEditBalance = (user) => {
    setCurrentGoods(user);
  };

  const handlePreCreatUser = (user?: TUser) => {
    setCurrentGoods(user);
  };

  const handleRefreshList = () => {
    refetch();
  };

  return (
    <>
      <div className="flex items-center">
        <Input
          placeholder="请输入用户名或邮箱筛选"
          value={(searchKey as string | undefined) ?? ''}
          onChange={handleSearchKeyChange}
          className="mb-5 mr-5 mt-5 max-w-sm border-border-medium placeholder:text-text-secondary"
        />

        <Button
          className="ml-4 transform select-none border-border-medium"
          variant="outline"
          onClick={() => handlePreCreatUser()}
        >
          + 创建新用户
        </Button>
      </div>
      <div className="relative max-h-[25rem] min-h-[630px] overflow-y-auto rounded-md border border-black/10 pb-4 dark:border-white/10">
        <Table className="w-full min-w-[600px] border-separate border-spacing-0">
          <TableHeader>
            <TableRow>
              <TableHead className="align-start sticky top-0 rounded-t border-b border-black/10 bg-white px-2 py-1 text-left font-medium text-gray-700 dark:border-white/10 dark:bg-gray-700 dark:text-gray-100 sm:px-4 sm:py-2">
                商品名称
              </TableHead>
              <TableHead className="align-start sticky top-0 rounded-t border-b border-black/10 bg-white px-2 py-1 text-left font-medium text-gray-700 dark:border-white/10 dark:bg-gray-700 dark:text-gray-100 sm:px-4 sm:py-2">
                市场价格
              </TableHead>
              <TableHead className="align-start sticky top-0 rounded-t border-b border-black/10 bg-white px-2 py-1 text-left font-medium text-gray-700 dark:border-white/10 dark:bg-gray-700 dark:text-gray-100 sm:px-4 sm:py-2">
                售价
              </TableHead>
              <TableHead className="align-start sticky top-0 rounded-t border-b border-black/10 bg-white px-2 py-1 text-left font-medium text-gray-700 dark:border-white/10 dark:bg-gray-700 dark:text-gray-100 sm:px-4 sm:py-2">
                类型
              </TableHead>
              <TableHead className="align-start sticky top-0 rounded-t border-b border-black/10 bg-white px-2 py-1 text-left font-medium text-gray-700 dark:border-white/10 dark:bg-gray-700 dark:text-gray-100 sm:px-4 sm:py-2">
                状态
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length ? (
              users.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-black/10 text-left text-gray-600 dark:border-white/10 dark:text-gray-300 [tr:last-child_&]:border-b-0"
                >
                  <TableCell className="align-start overflow-x-auto px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm [tr[data-disabled=true]_&]:opacity-50">
                    {row.name}
                  </TableCell>
                  <TableCell className="align-start overflow-x-auto px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm [tr[data-disabled=true]_&]:opacity-50">
                    {row.marketPrice}
                  </TableCell>
                  <TableCell className="align-start overflow-x-auto px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm [tr[data-disabled=true]_&]:opacity-50">
                    {row.price}
                  </TableCell>
                  <TableCell className="align-start overflow-x-auto px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm [tr[data-disabled=true]_&]:opacity-50">
                    {row.type}
                  </TableCell>
                  <TableCell className="align-start overflow-x-auto px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm [tr[data-disabled=true]_&]:opacity-50">
                    <Button
                      onClick={() => haldlePreDisabledUser(row)}
                      className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:text-white dark:hover:bg-red-800"
                    >
                      禁用/启用
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {localize('com_files_no_results')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="ml-4 mr-4 mt-4 flex h-auto items-center justify-end space-x-2 py-4 sm:ml-0 sm:mr-0 sm:h-0">
        <div className="text-muted-foreground ml-2 flex-1 text-sm">{`共${totalUsers}个用户`}</div>
        <Button
          className="select-none border-border-medium"
          variant="outline"
          size="sm"
          onClick={() => handlePreviousPage()}
          disabled={currentPage === 1}
        >
          上一页
        </Button>
        <Button
          className="select-none border-border-medium"
          variant="outline"
          size="sm"
          onClick={() => handleNextPage()}
          disabled={currentPage === pages}
        >
          下一页
        </Button>
      </div>
    </>
  );
}
