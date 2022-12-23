import { Controller } from '../utils';
import { Component, Water, Middleware, Query } from '@pjblog/http';
import { BlogRePrintProviderEntity } from '../entities/index';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic } from '@pjblog/core';
import type Prints from '../index';

interface IData {
  id: number,
  status: number,
  domain: string,
  code: string, // 文章code
  ctime: string | Date,
  mtime: string | Date,
}

interface IResponse {
  total: number,
  dataSource: IData[],
}

@Controller('GET', '/-/providers')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class ProvidersController extends Component<Prints, IResponse> {
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
      const repo = this.manager.getRepository(BlogRePrintProviderEntity);
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
          domain: d.domain,
          code: d.local_article_code,
          ctime: d.gmt_create,
          mtime: d.gmt_modified
        }
      });
    }
  }
}