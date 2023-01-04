import { MD5 } from 'crypto-js';
import { generate } from 'randomstring';
import { Controller } from '../utils';
import { Component, Water, Middleware, Request } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, BlogUserEntity } from '@pjblog/core';
import { HttpNotAcceptableException } from '@typeservice/exception';
import { encode } from '../utils';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

interface IBody {
  base64: string,
}

interface IInfo {
  domain: string,
  code: string,
}

@Controller('PUT', '/-/consumer')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class AddConsumerController extends Component<number, IBody> {
  public readonly manager: EntityManager;
  constructor(req: Request<IBody>) {
    super(req, Date.now());
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public base642json() {
    const data = this.req.body;
    const str = Buffer.from(data.base64, 'base64').toString('utf8');
    const info: IInfo = JSON.parse(str);
    return info;
  }

  @Water(2)
  public async check() {
    const options = this.getCache<AddConsumerController, 'base642json'>('base642json');
    const total = await this.manager.getRepository(BlogRePrintConsumerEntity).count({
      where: {
        target_domain: options.domain,
        target_article_code: options.code,
      }
    })
    if (total) throw new HttpNotAcceptableException('转载码已存在');
  }

  @Water(3)
  public async decode() {
    const id = MD5(generate() + Date.now()).toString();
    const token = await encode(this.manager, id);
    return {
      id, token
    }
  }

  @Water(4)
  public make() {
    const profile: BlogUserEntity = this.req.state.profile;
    const info = this.getCache<AddConsumerController, 'base642json'>('base642json');
    const decoder = this.getCache<AddConsumerController, 'decode'>('decode');
    const entity = new BlogRePrintConsumerEntity();
    entity.code = decoder.id;
    entity.uid = profile.id;
    entity.token = decoder.token;
    entity.status = 0;
    entity.target_domain = info.domain;
    entity.target_article_code = info.code;
    entity.local_article_id = 0;
    entity.gmt_create = new Date();
    entity.gmt_modified = new Date();
    return entity;
  }

  @Water(5)
  public save() {
    const entity = this.getCache<AddConsumerController, 'make'>('make');
    return this.manager.getRepository(BlogRePrintConsumerEntity).save(entity);
  }
}