import { Controller } from '../utils';
import { Component, Water, Request, Middleware } from '@pjblog/http';
import { numberic } from '@pjblog/core';
import { BlogRePrintArticleEntity } from '../entities/index';
import { HttpNotFoundException } from '@typeservice/exception';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin } from '@pjblog/core';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';


@Controller('DELETE', '/-/article/:id(\\d+)')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class DelArticleController extends Component<number> {
  public readonly manager: EntityManager;
  constructor(req: Request) {
    super(req, Date.now());
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public async checkExists() {
    const id = numberic(0)(this.req.params.id);
    if (!id) throw new HttpNotFoundException('找不到文章');
    const repo = this.manager.getRepository(BlogRePrintArticleEntity);
    const article = await repo.findOne({
      where: {
        id
      }
    })
    if (!article) throw new HttpNotFoundException('找不到文章');
    return article;
  }

  @Water(2)
  public save() {
    const article = this.getCache<DelArticleController, 'checkExists'>('checkExists');
    return this.manager.getRepository(BlogRePrintArticleEntity).delete(article.id);
  }
}