import { Controller, createRequest } from '../utils';
import { Component, Water, Request } from '@pjblog/http';
import { BlogArticleEntity, Configs } from '@pjblog/core';
import { BlogRePrintProviderEntity, BlogRePrintArticleEntity } from '../entities/index';
import { HttpNotAcceptableException, HttpNotFoundException, HttpBadRequestException } from '@typeservice/exception';
import { AgreeProviderController } from './_agree-provider';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

export interface IAddProviderControllerResponse {
  level: number,
};

interface IBody {
  base64: string,
}

interface IInfo {
  domain: string,
  token: string,
}

@Controller('PUT', '/provider/:acode')
export class AddProviderController extends Component<IAddProviderControllerResponse, IBody> {
  public readonly manager: EntityManager;
  constructor(req: Request<IBody>) {
    super(req, { level: -1 });
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public async checkArticleExists() {
    const code = this.req.params.acode;
    const repo = this.manager.getRepository(BlogArticleEntity);
    const total = await repo.count({
      where: {
        article_code: code
      }
    })
    if (!total) throw new HttpNotFoundException('找不到文章');
  }

  @Water(2)
  public async checkArticleLevelExists() {
    const code = this.req.params.acode;
    const repo = this.manager.getRepository(BlogRePrintArticleEntity);
    const art = await repo.findOne({
      where: {
        code
      }
    })
    if (!art) throw new HttpNotFoundException('文章禁止转载');
    this.res.level = art.level;
  }

  @Water(3)
  public base642json(): IInfo {
    const data = this.req.body;
    const str = Buffer.from(data.base64, 'base64').toString('utf8');
    return JSON.parse(str);
  }

  @Water(4)
  public async checkExists() {
    const info = this.getCache('base642json');
    const repo = this.manager.getRepository(BlogRePrintProviderEntity);
    const task = await repo.findOne({
      where: {
        domain: info.domain,
        token: info.token,
      }
    })
    if (task) throw new HttpNotAcceptableException('任务已存在');
  }

  @Water(5)
  public async getToken() {
    const code = this.req.params.acode;
    const info = this.getCache('base642json');
    const configs = getNode(Configs);
    const _configs = await configs.caches.get('configs').get({}, this.manager);
    const request = createRequest(info.domain);
    const res = await request.post<{ timestamp: number }>(
      '/vaild',
      {
        domain: _configs.blog_domain,
        code: code,
        token: info.token,
      }
    );
    if (!res.data?.timestamp) {
      throw new HttpBadRequestException('验证转载码失败');
    }
  }

  @Water(6)
  public create() {
    const code = this.req.params.acode;
    const info = this.getCache('base642json');
    const entity = new BlogRePrintProviderEntity();
    entity.token = info.token;
    entity.domain = info.domain;
    entity.status = 0;
    entity.local_article_code = code;
    entity.gmt_create = new Date();
    entity.gmt_modified = new Date();
    return entity;
  }

  @Water(7)
  public save() {
    const entity = this.getCache('create');
    return this.manager.getRepository(BlogRePrintProviderEntity).save(entity);
  }

  @Water(8)
  public next() {
    const entity = this.getCache('save');
    if (this.res.level === 1) {
      const req = new Request();
      req.setParam('id', entity.id + '');
      return this.invoke(AgreeProviderController, req);
    }
  }
}