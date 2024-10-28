class ConversationManager {
  constructor() {
    this.conversations = {};
  }

  getConversationData(openId) {
    return this.conversations[openId] || {
      conversationId: null,
      messageId: '00000000-0000-0000-0000-000000000000',
      generation: null,
      files: [],
    };
  }

  updateConversationData(openId, data) {
    if (!this.conversations[openId]) {
      this.conversations[openId] = {};
    }
    this.conversations[openId] = {
      ...this.conversations[openId],
      ...data,
    };
  }

  deleteConversationData(openId) {
    delete this.conversations[openId];
  }
}

module.exports = ConversationManager;