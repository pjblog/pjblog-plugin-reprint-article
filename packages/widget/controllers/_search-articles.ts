import { Controller } from '../utils';
import { Component, Water, Request, Middleware } from '@pjblog/http';
import { BlogArticleEntity } from '@pjblog/core';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin } from '@pjblog/core';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

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
export class SearchArticlesController extends Component<IResponse[], IBody> {
  public readonly manager: EntityManager;
  constructor(req: Request<IBody>) {
    super(req, []);
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public createRunner() {
    const data = this.req.body;
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

  @Water(2)
  public async save() {
    const runner = this.getCache<SearchArticlesController, 'createRunner'>('createRunner');
    this.res = await runner.getRawMany<IResponse>();
  }
}