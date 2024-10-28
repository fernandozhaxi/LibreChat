class TokenManager {
  constructor() {
    this.tokens = {};
  }

  getTokenInfo(openId) {
    return this.tokens[openId] || null;
  }

  updateTokenInfo(openId, accessToken = null, refreshToken = null) {
    if (!this.tokens[openId]) { return; }

    if (accessToken) {
      this.tokens[openId].access_token = accessToken;
    }
    if (refreshToken) {
      this.tokens[openId].refresh_token = refreshToken;
    }
  }
}

module.exports = TokenManager;