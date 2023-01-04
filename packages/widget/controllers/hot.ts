import { Controller } from '../utils';
import { Component, Water, Request } from '@pjblog/http';
import { BlogArticleEntity } from '@pjblog/core';
import { BlogRePrintProviderEntity } from '../entities/index';
import Prints from '../index';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

type IResponse = IData[];
interface IData {
  code: string,
  title: string,
  count: number | string
}

@Controller('GET', '/hot')
export class HotController extends Component<IData[]> {
  public readonly manager: EntityManager;
  public readonly prints: Prints;
  constructor(req: Request) {
    super(req, []);
    this.manager = getNode(TypeORM).value.manager;
    this.prints = getNode(Prints);
  }

  @Water(1)
  public createRunner() {
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
    runner.limit(this.prints.storage.get('hotPrintsSize'));

    return runner;
  }

  @Water(2)
  public async getDataSource() {
    const runner = this.getCache<HotController, 'createRunner'>('createRunner');
    this.res = await runner.getRawMany<IData>();
  }
}