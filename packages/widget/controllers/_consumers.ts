import { Controller } from '../utils';
import { Component, Water, Middleware, Request } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic, Configs } from '@pjblog/core';
import type Prints from '../index';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';


interface IData {
  id: number,
  status: number,
  domain: string,
  code: string,
  ctime: string | Date,
  mtime: string | Date,
  token: string
}

export interface IConsumersControllerResponse {
  total: number,
  dataSource: IData[],
}

@Controller('GET', '/-/consumers')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class ConsumersController extends Component<IConsumersControllerResponse> {
  public readonly manager: EntityManager;
  constructor(req: Request) {
    super(req, {
      total: 0,
      dataSource: [],
    });
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public async get() {
    const page = numberic(1)(this.req.query.page);
    const size = numberic(10)(this.req.query.size);
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
    this.res.total = count;
    this.res.dataSource = data.map(d => {
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