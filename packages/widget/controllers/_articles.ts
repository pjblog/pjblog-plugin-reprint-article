import { Controller } from '../utils';
import { Component, Water, Query, Middleware } from '@pjblog/http';
import { numberic, BlogArticleEntity } from '@pjblog/core';
import { BlogRePrintArticleEntity } from '../entities';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin } from '@pjblog/core';
import type Prints from '..';
import type { SelectQueryBuilder } from 'typeorm';

interface IResponse {
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
export class ArticlesController extends Component<Prints, IResponse> {
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
  public createRunner() {
    return () => {
      const repo = this.manager.getRepository(BlogRePrintArticleEntity);
      const runner = repo.createQueryBuilder('rp_arts');
      runner.leftJoin(BlogArticleEntity, 'art', 'art.article_code=rp_arts.code');
      runner.select('art.article_title', 'title');
      runner.addSelect('art.article_code', 'code');
      runner.addSelect('rp_arts.level', 'level');
      runner.addSelect('rp_arts.id', 'id');
      return runner;
    }
  }

  @Water({ stage: 1 })
  public total() {
    return async (context: IResponse, runner: SelectQueryBuilder<BlogRePrintArticleEntity>) => {
      const _runner = runner.clone();
      context.total = await _runner.getCount();
      return runner;
    }
  }

  @Water({ stage: 2 })
  public get(
    @Query('page', numberic(1)) page: number,
    @Query('size', numberic(10)) size: number,
  ) {
    return async (context: IResponse, runner: SelectQueryBuilder<BlogRePrintArticleEntity>) => {
      runner.orderBy({
        'rp_arts.gmt_create': 'DESC',
      })
      runner.offset((page - 1) * size);
      runner.limit(size);
      context.dataSource = await runner.getRawMany<IArticle>();
    }
  }
}