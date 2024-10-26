class TokenManager {
  constructor() {
    this.tokens = {};
  }

  getTokenInfo(user) {
    return this.tokens[user] || null;
  }

  updateTokenInfo(user, accessToken = null, refreshToken = null) {
    if (!this.tokens[user]) { return; }

    if (accessToken) {
      this.tokens[user].access_token = accessToken;
    }
    if (refreshToken) {
      this.tokens[user].refresh_token = refreshToken;
    }
  }
}

module.exports = TokenManager;