import { useState, useRef, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { MessageSquare } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { GearIcon } from '~/components/svg';
import { Vip, Point } from './ChargeTabs';
import { useMediaQuery } from '~/hooks';
import { cn } from '~/utils';
import { useGetGoodsQuery } from '~/data-provider';

export default function ChargeDialog({ open, onOpenChange, type }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: string;
}) {
  const isSmallScreen = useMediaQuery('(max-width: 767px)');
  const [activeTab, setActiveTab] = useState(type);
  const tabRefs = useRef({});

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const tabs = [
      'vip',
      'point',
    ];
    const currentIndex = tabs.indexOf(activeTab);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveTab(tabs[(currentIndex + 1) % tabs.length]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
        break;
      case 'Home':
        event.preventDefault();
        setActiveTab(tabs[0]);
        break;
      case 'End':
        event.preventDefault();
        setActiveTab(tabs[tabs.length - 1]);
        break;
    }
  };

  const { data: { list: goodsList = [] } = {}, refetch } =
    useGetGoodsQuery({
      pageNumber: 1,
      pageSize: 100,
      type: activeTab,
      searchKey: '',
    });

  useEffect(() => {
    refetch();
  }, [refetch, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Transition appear show={open}>
      <Dialog as="div" className="relative z-50" onClose={onOpenChange}>
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black opacity-50 dark:opacity-80" aria-hidden="true" />
        </TransitionChild>

        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className={cn('fixed inset-0 flex w-screen items-center justify-center p-4')}>
            <DialogPanel
              className={cn(
                'min-h-[600px] overflow-hidden rounded-xl rounded-b-lg bg-background pb-6 shadow-2xl backdrop-blur-2xl animate-in sm:rounded-2xl md:min-h-[373px] md:w-[680px]',
              )}
            >
              <DialogTitle
                className="mb-1 flex items-center justify-between p-6 pb-5 text-left"
                as="div"
              >
                <h2 className="text-lg font-medium leading-6 text-text-primary">

                </h2>
                <button
                  type="button"
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-border-xheavy focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-surface-primary dark:focus:ring-offset-surface-primary"
                  onClick={() => onOpenChange(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-text-primary"
                  >
                    <line x1="18" x2="6" y1="6" y2="18"></line>
                    <line x1="6" x2="18" y1="6" y2="18"></line>
                  </svg>
                  <span className="sr-only">Close</span>
                </button>
              </DialogTitle>
              <div className="max-h-[550px] overflow-auto px-6 md:max-h-[400px] md:min-h-[400px] md:w-[680px]">
                <Tabs.Root
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="flex flex-col gap-10 md:flex-row"
                  orientation="vertical"
                >
                  <Tabs.List
                    aria-label="Settings"
                    className={cn(
                      'min-w-auto max-w-auto relative -ml-[8px] flex flex-shrink-0 flex-col flex-nowrap overflow-auto sm:max-w-none',
                      isSmallScreen
                        ? 'flex-row rounded-xl bg-surface-secondary'
                        : 'sticky top-0 h-full',
                    )}
                    onKeyDown={handleKeyDown}
                  >
                    {[
                      {
                        value: 'vip',
                        icon: <GearIcon />,
                        label: '开通会员',
                      },
                      {
                        value: 'point',
                        icon: <MessageSquare className="icon-sm" />,
                        label: '充值积分',
                      },
                    ].map(({ value, icon, label }) => (
                      <Tabs.Trigger
                        key={value}
                        className={cn(
                          'group relative z-10 m-1 flex items-center justify-start gap-2 px-2 py-1.5 transition-all duration-200 ease-in-out',
                          isSmallScreen
                            ? 'flex-1 justify-center text-nowrap rounded-xl p-1 px-3 text-sm text-text-secondary radix-state-active:bg-surface-hover radix-state-active:text-text-primary'
                            : 'rounded-md bg-transparent text-text-primary radix-state-active:bg-surface-tertiary',
                        )}
                        value={value}
                        ref={(el) => (tabRefs.current[value] = el)}
                      >
                        {icon}
                        {label}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>
                  <div className="overflow-auto sm:w-full sm:max-w-none md:pr-0.5 md:pt-0.5">
                    <Tabs.Content value={'vip'}>
                      {activeTab === 'vip' && <Vip goodsList={goodsList} />}
                    </Tabs.Content>
                    <Tabs.Content value={'point'}>
                      {activeTab === 'point' && <Point goodsList={goodsList} />}
                    </Tabs.Content>
                  </div>
                </Tabs.Root>
              </div>
            </DialogPanel>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
