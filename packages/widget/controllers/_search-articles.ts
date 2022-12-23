import { Controller } from '../utils';
import { SelectQueryBuilder } from 'typeorm';
import { Component, Water, Body, Middleware } from '@pjblog/http';
import { BlogArticleEntity } from '@pjblog/core';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin } from '@pjblog/core';
import type Prints from '../index';

interface IResponse {
  title: string,
  code: string,
}

interface IBody {
  keyword: string,
}

@Controller('POST', '/-/articles/search')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class SearchArticlesController extends Component<Prints, IResponse[]> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse[] {
    return [];
  }

  @Water()
  public createRunner(@Body() data: IBody) {
    return () => {
      const repo = this.manager.getRepository(BlogArticleEntity)
      const runner = repo.createQueryBuilder('art');
      runner.select('art.article_title', 'title');
      runner.addSelect('art.article_code', 'code');
      runner.where('art.article_title LIKE :keyword', { keyword: '%' + data.keyword + '%'});
      runner.orderBy({
        'art.gmt_modified': 'DESC'
      })
      return runner;
    }
  }

  @Water({ stage: 1 })
  public save() {
    return async (context: IResponse[], runner: SelectQueryBuilder<BlogArticleEntity>) => {
      const res = await runner.getRawMany<IResponse>();
      context.push(...res);
    }
  }
}