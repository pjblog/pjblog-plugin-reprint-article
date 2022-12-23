import { Controller } from '../utils';
import { Component, Water } from '@pjblog/http';
import { BlogArticleEntity } from '@pjblog/core';
import { BlogRePrintProviderEntity } from '../entities/index';
import type Prints from '../index';
import type { SelectQueryBuilder } from 'typeorm';

type IResponse = IData[];

interface IData {
  code: string,
  title: string,
  count: number | string
}

@Controller('GET', '/hot')
export class HotController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return []
  }

  @Water()
  public createRunner() {
    return () => {
      const repo = this.manager.getRepository(BlogRePrintProviderEntity);
      const runner = repo.createQueryBuilder('p');

      runner.leftJoin(BlogArticleEntity, 'art', 'art.article_code=p.local_article_code');
      runner.select('art.article_title', 'title');
      runner.addSelect('art.article_code', 'code');
      runner.addSelect('COUNT(p.id)', 'count');
      runner.groupBy('art.article_code')
      runner.orderBy({
        'count': 'DESC'
      });
      runner.limit(this.container.storage.get('hotPrintsSize'));

      return runner
    }
  }

  @Water({ stage: 1 })
  public getDataSource() {
    return async (context: IResponse, runner: SelectQueryBuilder<BlogRePrintProviderEntity>) => {
      const res = await runner.getRawMany<IData>();
      context.push(...res);
    }
  }
}