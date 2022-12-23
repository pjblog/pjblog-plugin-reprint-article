import axios from 'axios';
import { Controller, createRequest } from '../utils';
import { getNode } from '@pjblog/manager';
import { Component, Water, Param, Body, Ctx } from '@pjblog/http';
import { BlogArticleEntity, Configs } from '@pjblog/core';
import { BlogRePrintProviderEntity, BlogRePrintArticleEntity } from '../entities/index';
import { HttpNotAcceptableException, HttpNotFoundException, HttpBadRequestException } from '@typeservice/exception';
import { AgreeProviderController } from './_agree-provider';
import type Prints from '../index';
import type { Context } from 'koa';

interface IResponse {
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
export class AddProviderController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return {
      level: -1
    }
  }

  @Water()
  public checkArticleExists(@Param('acode') code: string) {
    return async () => {
      const repo = this.manager.getRepository(BlogArticleEntity);
      const total = await repo.count({
        where: {
          article_code: code
        }
      })
      if (!total) throw new HttpNotFoundException('找不到文章');
    }
  }

  @Water()
  public checkArticleLevelExists(@Param('acode') code: string) {
    return async (context: IResponse) => {
      const repo = this.manager.getRepository(BlogRePrintArticleEntity);
      const art = await repo.findOne({
        where: {
          code
        }
      })
      if (!art) throw new HttpNotFoundException('文章禁止转载');
      context.level = art.level;
    }
  }

  @Water({ stage: 1 })
  public base642json(@Body() data: IBody) {
    return () => {
      const str = Buffer.from(data.base64, 'base64').toString('utf8');
      return JSON.parse(str);
    }
  }

  @Water({ stage: 2 })
  public checkExists() {
    return async (context: IResponse, info: IInfo) => {
      const repo = this.manager.getRepository(BlogRePrintProviderEntity);
      const task = await repo.findOne({
        where: {
          domain: info.domain,
          token: info.token,
        }
      })
      if (task) throw new HttpNotAcceptableException('任务已存在');
      return info;
    }
  }

  @Water({ stage: 3 })
  public getToken(@Param('acode') code: string) {
    return async (context: IResponse, info: IInfo) => {
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
      return info;
    }
  }

  @Water({ stage: 4 })
  public create(@Param('acode') code: string) {
    return (context: IResponse, info: IInfo) => {
      const entity = new BlogRePrintProviderEntity();
      entity.token = info.token;
      entity.domain = info.domain;
      entity.status = 0;
      entity.local_article_code = code;
      entity.gmt_create = new Date();
      entity.gmt_modified = new Date();
      return entity;
    }
  }

  @Water({ stage: 5 })
  public save() {
    return (context: IResponse, entity: BlogRePrintProviderEntity) => {
      return this.manager.getRepository(BlogRePrintProviderEntity).save(entity);
    }
  }

  @Water({ stage: 6 })
  public next(@Ctx() ctx: Context) {
    return async (context: IResponse, provider: BlogRePrintProviderEntity) => {
      if (context.level === 1) {
        ctx.params = {
          id: provider.id
        }
        return await this.invoke(AgreeProviderController, ctx);
      }
    }
  }
}