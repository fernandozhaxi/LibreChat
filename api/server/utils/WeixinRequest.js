const axios = require('axios');
const uuid = require('uuid');
const base_url = 'https://1ce6374ed662.vicp.fun';

class LibreChatAPI {
  constructor() {
    this.loginApi = '/api/auth/login';
    this.refreshApi = '/api/auth/refresh';
    this.askApi = '/api/ask/openAI';
    this.imageApi = '/api/files/images';
  }

  async login(email, password) {
    const url = `${base_url}${this.loginApi}`;
    const credentials = { email, password };
    try {
      const response = await axios.post(url, credentials);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken(accessToken, refreshToken) {
    const url = `${base_url}${this.refreshApi}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Cookie': `refreshToken=${refreshToken}`,
    };
    try {
      const response = await axios.post(url, {}, { headers });
      return response;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  async ask(headers, data) {
    const url = `${base_url}${this.askApi}`;
    try {
      const response = await axios.post(url, data, { headers, responseType: 'stream' });
      return response;
    } catch (error) {
      console.error('Ask error:', error);
      throw error;
    }
  }

  async uploadImage(headers, file) {
    const url = `${base_url}${this.imageApi}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_id', String(uuid.v4()));
    formData.append('width', '1280');
    formData.append('height', '1707');
    formData.append('endpoint', 'openAI');

    // 使用 headers 的 boundary 进行设置
    const response = await axios.post(url, formData, {
      headers: {
        ...headers,
        ...formData.getHeaders(),
      },
    });
    return response;
  }
}

class Request {
  constructor(user, tokenManager) {
    this.user = user;
    this.tokenManager = tokenManager;
    this.libreChatAPI = LibreChatAPI();
    this.accessToken = this._getAccessToken();
    this.refreshToken = this._getRefreshToken();
  }

  _getAccessToken() {
    const tokenInfo = this.tokenManager.getTokenInfo(this.user);
    return tokenInfo ? tokenInfo.access_token : null;
  }

  _getRefreshToken() {
    const tokenInfo = this.tokenManager.getTokenInfo(this.user);
    return tokenInfo ? tokenInfo.refresh_token : null;
  }

  async _login(email, password) {
    try {
      const response = await this.libreChatAPI.login(email, password);
      if (response.status === 200) {
        const data = response.data;
        this.accessToken = data.token;
        this.refreshToken = response.headers['set-cookie'].split(';').find(cookie => cookie.trim().startsWith('refreshToken')).split('=')[1];
        return this.accessToken;
      } else {
        console.log('Login failed:', response.status);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  async _refreshToken() {
    const email = user_credentials[this.user].email;
    const password = user_credentials[this.user].password;

    if (!this.accessToken && !this.refreshToken) {
      await this._login(email, password);
    } else {
      const response = await this.libreChatAPI.refreshToken(this.accessToken, this.refreshToken);
      console.log('refresh token', response);
      if (response.status === 200) {
        const data = response.data;
        this.accessToken = data.token;
        this.refreshToken = response.headers['set-cookie'].split(';').find(cookie => cookie.trim().startsWith('refreshToken')).split('=')[1];
      } else {
        console.log('Need relogin');
        await this._login(email, password);
      }
    }

    this.tokenManager.updateTokenInfo(this.user, this.accessToken, this.refreshToken);
    return this.accessToken;
  }

  getHeaders(isUpload) {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Origin': base_url,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    };

    if (isUpload) {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      headers['Boundary'] = boundary;
    } else {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  async getResponse(prompt, conversationManager) {
    const conversationData = conversationManager.getConversationData(this.user);

    const data = {
      conversationId: conversationData.conversationId,
      endpoint: 'openAI',
      error: false,
      generation: conversationData.generation,
      isContinued: false,
      isCreatedByUser: true,
      key: 'never',
      files: conversationData.files || [],
      messageId: uuid.v4(),
      model: 'gpt-4o-mini',
      overrideParentMessageId: null,
      parentMessageId: conversationData.messageId,
      responseMessageId: conversationData.messageId,
      sender: 'User',
      text: prompt,
    };

    console.log(data);
    let response = await this.libreChatAPI.ask(this.getHeaders(false), data);

    console.log('response:', response);
    if (response.status === 401) {
      await this._refreshToken();
      response = await this.libreChatAPI.ask(this.getHeaders(false), data);
    }

    console.log('response:', response);
    let final_response = {};

    if (response.status === 200) {
      final_response = response.data;
      console.log('final_response', final_response);
      conversationManager.updateConversationData(this.user, {
        conversationId: final_response.responseMessage.conversationId,
        messageId: final_response.responseMessage.messageId,
        generation: final_response.responseMessage.text,
        files: [], // clear files
      });
      return final_response.responseMessage.text;
    } else {
      return null;
    }
  }

  async uploadImage(imageData, conversationManager) {
    let firstHeader = this.getHeaders(true);
    let response = await this.libreChatAPI.uploadImage(firstHeader, imageData);

    console.log(response.status);
    if (response.status === 401) {
      await this._refreshToken();
      firstHeader = this.getHeaders(true);
      response = await this.libreChatAPI.uploadImage(firstHeader, imageData);
    }

    if (response.status === 200) {
      const fileData = response.data;
      const conversationData = conversationManager.getConversationData(this.user);

      if (!conversationData.files) {
        conversationData.files = [];
      }

      const files = conversationData.files;
      files.push({
        file_id: fileData.file_id,
        filepath: fileData.filepath,
        height: fileData.height,
        width: fileData.width,
        type: fileData.type,
      });

      conversationManager.updateConversationData(this.user, {
        files: files,
      });

      return true;
    } else {
      console.log(response.status);
      return false;
    }
  }
}

module.exports = Request;