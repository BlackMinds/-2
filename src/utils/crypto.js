import CryptoJS from 'crypto-js'

// 密钥和偏移量，建议从安全的地方获取，例如环境变量
const SECRET_KEY = CryptoJS.enc.Utf8.parse('jiangjunting9999') // 16位密钥
const SECRET_IV = CryptoJS.enc.Utf8.parse('jiangjunting9999') // 16位偏移量

/**
 * 加密方法
 * @param {object} data - 需要加密的数据
 * @returns {string} - 加密后的字符串
 */
export function encrypt (data) {
  if (typeof data === 'object') {
    try {
      data = JSON.stringify(data)
    } catch (error) {
      console.error('encrypt error:', error)
    }
  }
  const dataHex = CryptoJS.enc.Utf8.parse(data)
  const encrypted = CryptoJS.AES.encrypt(dataHex, SECRET_KEY, {
    iv: SECRET_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.ciphertext.toString()
}

/**
 * 解密方法
 * @param {string} data - 需要解密的数据
 * @returns {object} - 解密后的对象
 */
export function decrypt (data) {
  const encryptedHexStr = CryptoJS.enc.Hex.parse(data)
  const str = CryptoJS.enc.Base64.stringify(encryptedHexStr)
  const decrypt = CryptoJS.AES.decrypt(str, SECRET_KEY, {
    iv: SECRET_IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8)
  try {
    return JSON.parse(decryptedStr)
  } catch (error) {
    return decryptedStr
  }
}
