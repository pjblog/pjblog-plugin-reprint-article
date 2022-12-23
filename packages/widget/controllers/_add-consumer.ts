import { MD5 } from 'crypto-js';
import { generate } from 'randomstring';
import { Controller } from '../utils';
import { Component, Water, Body, Middleware, State } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, BlogUserEntity } from '@pjblog/core';
import { HttpNotAcceptableException } from '@typeservice/exception';
import { encode } from '../utils';
import type Prints from '../index';

type IResponse = number;

interface IBody {
  base64: string,
}

interface IInfo {
  domain: string,
  code: string,
}

interface IData extends IInfo {
  id: string,
  token: string,
}

@Controller('PUT', '/-/consumer')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class AddConsumerController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return Date.now();
  }

  @Water()
  public base642json(@Body() data: IBody) {
    return () => {
      const str = Buffer.from(data.base64, 'base64').toString('utf8');
      const info: IInfo = JSON.parse(str);
      return info;
    }
  }

  @Water({ stage: 1 })
  public check() {
    return async (context: IResponse, options: IInfo) => {
      const total = await this.manager.getRepository(BlogRePrintConsumerEntity).count({
        where: {
          target_domain: options.domain,
          target_article_code: options.code,
        }
      })
      if (total) throw new HttpNotAcceptableException('转载码已存在');
      return options;
    }
  }

  @Water({ stage: 2 })
  public decode(@Body() data: IBody) {
    return async (context: IResponse, info: IInfo) => {
      const id =  MD5(generate() + Date.now()).toString();
      const token = await encode(this.manager, id);
      return {
        ...info,
        id, token,
      }
    }
  }

  @Water({ stage: 3 })
  public make(@State('profile') profile: BlogUserEntity) {
    return (context: IResponse, options: IData) => {
      const entity = new BlogRePrintConsumerEntity();
      entity.code = options.id;
      entity.uid = profile.id;
      entity.token = options.token;
      entity.status = 0;
      entity.target_domain = options.domain;
      entity.target_article_code = options.code;
      entity.local_article_id = 0;
      entity.gmt_create = new Date();
      entity.gmt_modified = new Date();
      return entity;
    }
  }

  @Water({ stage: 4 })
  public save() {
    return (context: IResponse, entity: BlogRePrintConsumerEntity) => {
      return this.manager.getRepository(BlogRePrintConsumerEntity).save(entity);
    }
  }
}