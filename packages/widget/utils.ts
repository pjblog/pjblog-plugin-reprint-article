import axios from 'axios';
import { AES, enc } from 'crypto-js';
import { createHttpPluginRouter, BlogConfigsEntity } from '@pjblog/core';
import { getNode } from '@pjblog/manager';
import { Configs } from '@pjblog/core';
import { _ } from '@pjblog/configs';
import type { EntityManager } from 'typeorm';
const PKG = require('../../package.json');
export const Controller = createHttpPluginRouter(PKG.name);
export interface IConfigs {
  hotPrintsSize: number
}

/**
 * 加密算法
 * @param manager 
 * @param value 唯一ID
 * @returns 
 */
export async function encode(manager: EntityManager, value: string): Promise<string> {
  const configs = await getNode(Configs).getCache('configs').get({}, manager);
  return AES.encrypt(value, createSecretKey(configs)).toString();
}

/**
 * 解密算法
 * @param manager 
 * @param token 加密串
 * @returns 
 */
export async function decode(manager: EntityManager, token: string): Promise<string> {
  const configs = await getNode(Configs).getCache('configs').get({}, manager);
  const bytes = AES.decrypt(token, createSecretKey(configs));
  return bytes.toString(enc.Utf8);
}

function createSecretKey(configs: BlogConfigsEntity) {
  return configs.blog_cache_namespace + ':' + _.configure.cookie.join(':');
}

/**
 * 创建请求对象
 * @param domain 
 * @returns 
 */
export function createRequest(domain: string) {
  const request = axios.create({
    baseURL: domain + '/-/plugin/pjblog-plugin-reprint-article',
    withCredentials: true,
  })
  request.interceptors.response.use(response => {
    if (response.data.status !== 200) {
      return Promise.reject({ 
        code: response.data.status, 
        message: response.data.error,
      })
    }
    response.data = response.data.data;
    return response;
  }, error => {
    if (error?.status){
      error.code = error.status;
      return Promise.reject(error);
    }
    if (error.response) return Promise.reject({
      code: error.response.status,
      message: error.response.data,
    })
    return Promise.reject({
      code: 500,
      message: error.message,
    })
  });
  return request;
}