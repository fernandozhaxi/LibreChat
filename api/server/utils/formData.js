const mime = require('mime');
class MultipartFormData {
  constructor() {
    this._boundary = void 0;
    this._chunks = [];
    this._boundary = generateUniqueBoundaryString();
  }
  contentTypeHeader() {
    return `multipart/form-data; boundary=${this._boundary}`;
  }
  addField(name, value) {
    this._beginMultiPartHeader(name);
    this._finishMultiPartHeader();
    this._chunks.push(Buffer.from(value));
    this._finishMultiPartField();
  }
  addFileField(name, filename, value) {
    this._beginMultiPartHeader(name);
    this._chunks.push(Buffer.from(`; filename="${filename}"`));
    this._chunks.push(Buffer.from(`\r\ncontent-type: ${mime.getType(filename)}`));
    this._finishMultiPartHeader();
    this._chunks.push(value);
    this._finishMultiPartField();
  }
  finish() {
    this._addBoundary(true);
    return Buffer.concat(this._chunks);
  }
  _beginMultiPartHeader(name) {
    this._addBoundary();
    this._chunks.push(Buffer.from(`content-disposition: form-data; name="${name}"`));
  }
  _finishMultiPartHeader() {
    this._chunks.push(Buffer.from('\r\n\r\n'));
  }
  _finishMultiPartField() {
    this._chunks.push(Buffer.from('\r\n'));
  }
  _addBoundary(isLastBoundary) {
    this._chunks.push(Buffer.from('--' + this._boundary));
    if (isLastBoundary) {
      this._chunks.push(Buffer.from('--'));
    }
    this._chunks.push(Buffer.from('\r\n'));
  }
}
const alphaNumericEncodingMap = [
  0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50,
  0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66,
  0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76,
  0x77, 0x78, 0x79, 0x7a, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x41, 0x42,
];

// See generateUniqueBoundaryString() in WebKit
function generateUniqueBoundaryString() {
  const charCodes = [];
  for (let i = 0; i < 16; i++) {
    charCodes.push(
      alphaNumericEncodingMap[Math.floor(Math.random() * alphaNumericEncodingMap.length)],
    );
  }
  return '----WebKitFormBoundary' + String.fromCharCode(...charCodes);
}

exports.MultipartFormData = MultipartFormData;
