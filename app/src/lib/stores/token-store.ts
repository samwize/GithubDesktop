import {
  deleteSecureStoreItem,
  getSecureStoreItem,
  setSecureStoreItem,
} from '../../ui/main-process-proxy'

function setItem(key: string, login: string, value: string) {
  return setSecureStoreItem(key, login, value)
}

function getItem(key: string, login: string) {
  return getSecureStoreItem(key, login)
}

function deleteItem(key: string, login: string) {
  return deleteSecureStoreItem(key, login)
}

export const TokenStore = {
  setItem,
  getItem,
  deleteItem,
}
