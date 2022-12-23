import { Controller } from '../utils';
import { getNode } from '@pjblog/manager';
import { Component, Water, Middleware, Query } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic, Configs } from '@pjblog/core';
import type Prints from '../index';

interface IData {
  id: number,
  status: number,
  domain: string,
  code: string,
  ctime: string | Date,
  mtime: string | Date,
  token: string
}

interface IResponse {
  total: number,
  dataSource: IData[],
}

@Controller('GET', '/-/consumers')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class ConsumersController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return {
      total: 0,
      dataSource: [],
    }
  }

  @Water()
  public get(
    @Query('page', numberic(1)) page: number,
    @Query('size', numberic(10)) size: number,
  ) {
    return async (context: IResponse) => {
      const configs = getNode(Configs);
      const _configs = await configs.getCache('configs').get({}, this.manager);
      const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
      const [data, count] = await repo.findAndCount({
        skip: (page - 1) * size,
        take: size,
        order: {
          'gmt_create': 'DESC'
        },
      })
      context.total = count;
      context.dataSource = data.map(d => {
        return {
          id: d.id,
          status: d.status,
          domain: d.target_domain,
          code: d.target_article_code,
          ctime: d.gmt_create,
          mtime: d.gmt_modified,
          token: Buffer.from(JSON.stringify({ domain: _configs.blog_domain, token: d.token })).toString('base64'),
        }
      });
    }
  }
}