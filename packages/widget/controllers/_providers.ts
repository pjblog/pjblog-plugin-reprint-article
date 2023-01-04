import { Controller } from '../utils';
import { Component, Water, Middleware, Request } from '@pjblog/http';
import { BlogRePrintProviderEntity } from '../entities/index';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic } from '@pjblog/core';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

interface IData {
  id: number,
  status: number,
  domain: string,
  code: string, // 文章code
  ctime: string | Date,
  mtime: string | Date,
}

export interface IProvidersControllerResponse {
  total: number,
  dataSource: IData[],
}

@Controller('GET', '/-/providers')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class ProvidersController extends Component<IProvidersControllerResponse> {
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
    const repo = this.manager.getRepository(BlogRePrintProviderEntity);
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
        domain: d.domain,
        code: d.local_article_code,
        ctime: d.gmt_create,
        mtime: d.gmt_modified
      }
    });
  }
}