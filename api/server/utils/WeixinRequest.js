const uuid = require('uuid');
const path = require('path');
const fetch = require('node-fetch');
const _formData = require('./formData');
const { logger } = require('~/config');

// const base_url = 'https://www.cdyz.top';
// const base_url = 'https://1ce6374ed662.vicp.fun';
// const base_url = 'http://127.0.0.1:3080';
const base_url = 'http://localhost:3080';

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
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
  }

  async refreshToken(accessToken, refreshToken) {
    const url = `${base_url}${this.refreshApi}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Cookie: `refreshToken=${refreshToken}`,
    };
    return fetch(url, {
      method: 'POST',
      headers: headers,
    });
  }

  async ask(headers, data) {
    const url = `${base_url}${this.askApi}`;
    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });
  }

  async getFormData(headers, buffer, fileName) {
    const formData = new _formData.MultipartFormData();
    formData.addFileField('file', fileName, buffer);
    formData.addField('width', '100');
    formData.addField('height', '100');
    formData.addField('endpoint', 'openAI');
    formData.addField('file_id', String(uuid.v4()));
    return {
      data: formData.finish(),
      contentType: formData.contentTypeHeader(),
    };
  }

  async uploadImage(headers, buffer, fileName) {
    const url = `${base_url}${this.imageApi}`;
    const { data, contentType } = await this.getFormData(headers, buffer, fileName);
    const header =
    {
      ...headers,
      'Content-Type': contentType,
    };

    return fetch(url, {
      method: 'POST',
      headers: header,
      body: data,
    });
  }
}

class Request {
  constructor(openId, tokenManager) {
    this.openId = openId;
    this.tokenManager = tokenManager;
    this.libreChatAPI = new LibreChatAPI();
    this.accessToken = this._getAccessToken();
    this.refreshToken = this._getRefreshToken();
  }

  _getAccessToken() {
    const tokenInfo = this.tokenManager.getTokenInfo(this.openId);
    return tokenInfo ? tokenInfo.access_token : null;
  }

  _getRefreshToken() {
    const tokenInfo = this.tokenManager.getTokenInfo(this.openId);
    return tokenInfo ? tokenInfo.refresh_token : null;
  }

  async _login(email, password) {
    try {
      const response = await this.libreChatAPI.login(email, password);
      const data = await response.json();
      this.accessToken = data.token;
      const cookie = response.headers.get('set-cookie');
      this.refreshToken = cookie
        .split(';')
        .find((cookie) => cookie.trim().startsWith('refreshToken'))
        .split('=')[1];
      return this.accessToken;
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  async _refreshToken() {
    const email = `${this.openId.substring(0, 10)}@user.com`;
    const password = this.openId;

    if (!this.accessToken && !this.refreshToken) {
      await this._login(email, password);
    } else {
      const response = await this.libreChatAPI.refreshToken(this.accessToken, this.refreshToken);
      const data = await response.json();
      if (response.status === 200) {
        this.accessToken = data.token;
        const cookie = response.headers.get('set-cookie');
        this.refreshToken = cookie
          .split(';')
          .find((cookie) => cookie.trim().startsWith('refreshToken'))
          .split('=')[1];
      } else {
        await this._login(email, password);
      }
    }

    this.tokenManager.updateTokenInfo(this.openId, this.accessToken, this.refreshToken);
    return this.accessToken;
  }

  getHeaders(isUpload) {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      Origin: base_url,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    };

    if (isUpload) {
      headers['Content-Type'] = 'multipart/form-data';
    } else {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async getTextResponse(text, conversationManager) {
    const conversationData = conversationManager.getConversationData(this.openId);

    const params = {
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
      text: text,
    };

    let response = await this.libreChatAPI.ask(this.getHeaders(false), params);

    if (response.status === 401) {
      await this._refreshToken();
      response = await this.libreChatAPI.ask(this.getHeaders(false), params);
    }

    if (response.status === 200) {
      let result = '';
      try {
        const decoder = new TextDecoder('utf-8');
        for await (const chunk of response.body) {
          let text = decoder.decode(chunk, { stream: false });
          text = text.trim();
          result += text;
        }
        const msgList = result.split('\n');
        let lastMsg = msgList[msgList.length - 1];
        lastMsg = JSON.parse(lastMsg);
        let final_response = lastMsg.responseMessage;
        logger.info(final_response);
        if (final_response.error) {
          return false;
        } else {
          conversationManager.updateConversationData(this.openId, {
            conversationId: final_response.conversationId,
            messageId: final_response.messageId,
            generation: final_response.text,
            files: [], // clear files
          });
          return final_response.text;
        }
      } catch (err) {
        return false;
      }
    } else {
      return false;
    }
  }

  streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];

      stream.on('data', chunk => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', reject);
    });
  }

  async uploadImage(user, picUrl, conversationManager) {
    const fileName = path.basename(picUrl);
    const downRes = await fetch(picUrl);
    const imageStream = await downRes.body;
    const buffer = await this.streamToBuffer(imageStream);
    let response = await this.libreChatAPI.uploadImage(this.getHeaders(true), buffer, fileName);
    if (response.status === 401) {
      await this._refreshToken();
      response = await this.libreChatAPI.uploadImage(this.getHeaders(true), buffer, fileName);
    }
    if (response.status === 200) {
      const fileData = response.json();
      const conversationData = conversationManager.getConversationData(this.openId);

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

      conversationManager.updateConversationData(this.openId, {
        files: files,
      });

      return true;
    } else {
      return false;
    }
  }
}

module.exports = Request;
