import type { InfiniteData } from '@tanstack/react-query';
import type * as t from '../types';
import type { TMessage, TConversation, TSharedLink, TConversationTag } from '../schemas';

export type Conversation = {
  id: string;
  createdAt: number;
  participants: string[];
  lastMessage: string;
  conversations: TConversation[];
};

// Parameters for listing conversations (e.g., for pagination)
export type ConversationListParams = {
  limit?: number;
  before?: string | null;
  after?: string | null;
  order?: 'asc' | 'desc';
  pageNumber: string;
  conversationId?: string;
  isArchived?: boolean;
  tags?: string[];
};

// Type for the response from the conversation list API
export type ConversationListResponse = {
  conversations: TConversation[];
  pageNumber: string;
  pageSize: string | number;
  pages: string | number;
  messages: TMessage[];
};

export type ConversationData = InfiniteData<ConversationListResponse>;
export type ConversationUpdater = (
  data: ConversationData,
  conversation: TConversation,
) => ConversationData;

export type SharedMessagesResponse = Omit<TSharedLink, 'messages'> & {
  messages: TMessage[];
};
export type SharedLinkListParams = Omit<ConversationListParams, 'isArchived' | 'conversationId'> & {
  isPublic?: boolean;
};

export type SharedLinksResponse = Omit<ConversationListResponse, 'conversations' | 'messages'> & {
  sharedLinks: TSharedLink[];
};

// Type for the response from the conversation list API
export type SharedLinkListResponse = {
  sharedLinks: TSharedLink[];
  pageNumber: string;
  pageSize: string | number;
  pages: string | number;
};

export type SharedLinkListData = InfiniteData<SharedLinkListResponse>;

export type AllPromptGroupsFilterRequest = {
  category: string;
  pageNumber: string;
  pageSize: string | number;
  before?: string | null;
  after?: string | null;
  order?: 'asc' | 'desc';
  name?: string;
  author?: string;
};

export type AllPromptGroupsResponse = t.TPromptGroup[];

export type ConversationTagsResponse = TConversationTag[];

// Parameters for listing users (e.g., for pagination)
export type GetUsersParams = {
  searchKey: string;
  pageNumber: number;
  pageSize: number;
};

// Type for the response from the getUsers list API
export type GetUsersResponse = {
  list: t.TUser[];
  pageNumber: string | number;
  pageSize: string | number;
  pages: string | number;
  count: string | number;
};

// Parameters for listing goods (e.g., for pagination)
export type GetGoodsParams = {
  searchKey: string;
  pageNumber: number;
  pageSize: number;
};

// Type for the response from the getGoods list API
export type GetGoodsResponse = {
  list: t.TGoods[];
  pageNumber: string | number;
  pageSize: string | number;
  pages: string | number;
  count: string | number;
};

// Parameters for listing orders (e.g., for pagination)
export type GetOrdersParams = {
  searchKey: string;
  pageNumber: number;
  pageSize: number;
};

// Type for the response from the getOrders list API
export type GetOrdersResponse = {
  list: t.TOrder[];
  pageNumber: string | number;
  pageSize: string | number;
  pages: string | number;
  count: string | number;
};