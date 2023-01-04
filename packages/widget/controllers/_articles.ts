import { Controller } from '../utils';
import { Component, Water, Request, Middleware } from '@pjblog/http';
import { numberic, BlogArticleEntity } from '@pjblog/core';
import { BlogRePrintArticleEntity } from '../entities';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin } from '@pjblog/core';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

export interface IArticlesControllerResponse {
  total: number,
  dataSource: IArticle[],
}

interface IArticle {
  id: number,
  title: string,
  code: string,
  level: number,
}

@Controller('GET', '/-/articles')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class ArticlesController extends Component<IArticlesControllerResponse> {
  public readonly manager: EntityManager;
  constructor(req: Request) {
    super(req, {
      total: 0,
      dataSource: [],
    });
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public createRunner() {
    const repo = this.manager.getRepository(BlogRePrintArticleEntity);
    const runner = repo.createQueryBuilder('rp_arts');
    runner.leftJoin(BlogArticleEntity, 'art', 'art.article_code=rp_arts.code');
    runner.select('art.article_title', 'title');
    runner.addSelect('art.article_code', 'code');
    runner.addSelect('rp_arts.level', 'level');
    runner.addSelect('rp_arts.id', 'id');
    return runner;
  }

  @Water(2)
  public async total() {
    const runner = this.getCache<ArticlesController, 'createRunner'>('createRunner');
    const _runner = runner.clone();
    this.res.total = await _runner.getCount();
  }

  @Water(3)
  public async get() {
    const page = numberic(1)(this.req.query.page);
    const size = numberic(10)(this.req.query.size);
    const runner = this.getCache<ArticlesController, 'createRunner'>('createRunner');
    runner.orderBy({
      'rp_arts.gmt_create': 'DESC',
    })
    runner.offset((page - 1) * size);
    runner.limit(size);
    this.res.dataSource = await runner.getRawMany<IArticle>();
  }
}