class ConversationManager {
  constructor() {
    this.conversations = {};
  }

  getConversationData(user) {
    return this.conversations[user] || {
      conversationId: null,
      messageId: '00000000-0000-0000-0000-000000000000',
      generation: null,
      files: [],
    };
  }

  updateConversationData(user, data) {
    if (!this.conversations[user]) {
      this.conversations[user] = {};
    }
    this.conversations[user] = {
      ...this.conversations[user],
      ...data,
    };
  }

  deleteConversationData(user) {
    delete this.conversations[user];
  }
}

module.exports = ConversationManager;