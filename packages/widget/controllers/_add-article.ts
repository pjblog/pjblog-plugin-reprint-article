import { Controller } from '../utils';
import { Component, Water, Request, Middleware } from '@pjblog/http';
import { BlogRePrintArticleEntity } from '../entities/index';
import { HttpNotFoundException } from '@typeservice/exception';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin } from '@pjblog/core';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

interface IBody {
  level: number,
  code: string,
}

@Controller('PUT', '/-/article')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class AddArticleController extends Component<number, IBody> {
  public readonly manager: EntityManager;
  constructor(req: Request<IBody>) {
    super(req, Date.now());
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public async checkExists() {
    const data = this.req.body;
    const repo = this.manager.getRepository(BlogRePrintArticleEntity);
    const total = await repo.count({
      where: {
        code: data.code,
      }
    })
    if (total) throw new HttpNotFoundException('文章已存在');
  }

  @Water(2)
  public save() {
    const data = this.req.body;
    const article = new BlogRePrintArticleEntity();
    article.code = data.code;
    article.level = data.level;
    article.gmt_create = new Date();
    article.gmt_modified = new Date();
    return this.manager.getRepository(BlogRePrintArticleEntity).save(article);
  }
}