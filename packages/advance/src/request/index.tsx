import axios from 'axios';
import { interceptRequestSuccess } from './success';
import { interceptRequestError } from './error';

export const request = axios.create({
  baseURL: '/-/plugin/pjblog-plugin-reprint-article',
  withCredentials: true,
})

request.interceptors.response.use(interceptRequestSuccess, interceptRequestError);