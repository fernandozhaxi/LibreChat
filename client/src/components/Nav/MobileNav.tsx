import React from 'react';
import { useRecoilValue } from 'recoil';
import type { Dispatch, SetStateAction } from 'react';
import { useLocalize, useNewConvo } from '~/hooks';
import store from '~/store';

export default function MobileNav({
  setNavVisible,
}: {
  setNavVisible: Dispatch<SetStateAction<boolean>>;
}) {
  const localize = useLocalize();
  const { newConversation } = useNewConvo(0);
  const conversation = useRecoilValue(store.conversationByIndex(0));
  const { title = 'New Chat' } = conversation || {};

  return (
    <div className="bg-token-main-surface-primary sticky top-0 z-10 flex min-h-[40px] items-center justify-center bg-white pl-1 dark:bg-gray-800 dark:text-white md:hidden">
      <button
        type="button"
        data-testid="mobile-header-new-chat-button"
        aria-label={localize('com_nav_open_sidebar')}
        className="m-1 inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-hover"
        onClick={() =>
          setNavVisible((prev) => {
            localStorage.setItem('navVisible', JSON.stringify(!prev));
            return !prev;
          })
        }
      >
        <span className="sr-only">{localize('com_nav_open_sidebar')}</span>
        <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1477" width="24" height="24">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            fill="currentColor"
            d="M396.72 320.592a141.184 141.184 0 0 1-99.824 15.92 277.648 277.648 0 0 0-45.344 74.576 141.216 141.216 0 0 1 37.52 95.952 141.248 141.248 0 0 1-41.728 100.32 274.4 274.4 0 0 0 49.952 86.224 141.264 141.264 0 0 1 107.168 14.176 141.216 141.216 0 0 1 63.984 79.296 274.72 274.72 0 0 0 86.816-1.92 141.248 141.248 0 0 1 66.016-86.304 141.216 141.216 0 0 1 101.856-15.488 277.648 277.648 0 0 0 41.92-76.544 141.184 141.184 0 0 1-36.128-94.4c0-34.912 12.768-67.68 34.816-92.96a274.736 274.736 0 0 0-38.192-70.032 141.264 141.264 0 0 1-105.792-14.56 141.312 141.312 0 0 1-67.168-90.912 274.4 274.4 0 0 0-92.784 0.016 141.152 141.152 0 0 1-63.088 76.64z m22.56-116.656c57.312-16 119.024-16.224 178.016 1.216a93.44 93.44 0 0 0 142.288 86.736 322.64 322.64 0 0 1 79.104 142.656 93.328 93.328 0 0 0-41.76 77.84 93.36 93.36 0 0 0 42.88 78.592 322.832 322.832 0 0 1-34.208 85.232 323.392 323.392 0 0 1-47.968 63.568 93.392 93.392 0 0 0-92.352 0.64 93.408 93.408 0 0 0-46.688 83.616 322.704 322.704 0 0 1-171.424 3.84 93.376 93.376 0 0 0-46.704-78.544 93.408 93.408 0 0 0-95.184 1.008A322.432 322.432 0 0 1 192 589.28a93.408 93.408 0 0 0 49.072-82.24c0-34.128-18.304-64-45.632-80.288a323.392 323.392 0 0 1 31.088-73.328 322.832 322.832 0 0 1 56.704-72.256 93.36 93.36 0 0 0 89.488-2.144 93.328 93.328 0 0 0 46.56-75.088z m92.208 385.28a68.864 68.864 0 1 0 0-137.76 68.864 68.864 0 0 0 0 137.76z m0 48a116.864 116.864 0 1 1 0-233.76 116.864 116.864 0 0 1 0 233.76z">
          </path>
        </svg>
      </button>
      <h1 className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-normal">
        {title || localize('com_ui_new_chat')}
      </h1>
      <button
        type="button"
        aria-label={localize('com_ui_new_chat')}
        className="m-1 inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-hover"
        onClick={() => newConversation()}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="icon-md"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M16.7929 2.79289C18.0118 1.57394 19.9882 1.57394 21.2071 2.79289C22.4261 4.01184 22.4261 5.98815 21.2071 7.20711L12.7071 15.7071C12.5196 15.8946 12.2652 16 12 16H9C8.44772 16 8 15.5523 8 15V12C8 11.7348 8.10536 11.4804 8.29289 11.2929L16.7929 2.79289ZM19.7929 4.20711C19.355 3.7692 18.645 3.7692 18.2071 4.2071L10 12.4142V14H11.5858L19.7929 5.79289C20.2308 5.35499 20.2308 4.64501 19.7929 4.20711ZM6 5C5.44772 5 5 5.44771 5 6V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V14C19 13.4477 19.4477 13 20 13C20.5523 13 21 13.4477 21 14V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V6C3 4.34314 4.34315 3 6 3H10C10.5523 3 11 3.44771 11 4C11 4.55228 10.5523 5 10 5H6Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}
