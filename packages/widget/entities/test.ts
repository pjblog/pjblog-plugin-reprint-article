import { AES, enc } from 'crypto-js';

const secret = 'true135dsfdsfdsf';
const obj = {
  domain: 'http://baidu.com',
  code: 'token',
}
const encodeText = AES.encrypt(JSON.stringify(obj), secret).toString();
console.log('encodeText', encodeText)

const bytes = AES.decrypt(encodeText, secret);
const decodeText = JSON.parse(bytes.toString(enc.Utf8));
console.log('decode', decodeText);