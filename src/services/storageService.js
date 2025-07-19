import { encrypt, decrypt } from '@/utils/crypto'

export const storageService = {
  setItem (key, value) {
    const encryptedValue = encrypt(value)
    localStorage.setItem(key, encryptedValue)
  },

  getItem (key) {
    const encryptedValue = localStorage.getItem(key)
    if (encryptedValue) {
      return decrypt(encryptedValue)
    }
    return null
  },

  removeItem (key) {
    localStorage.removeItem(key)
  },

  clear () {
    localStorage.clear()
  }
}
