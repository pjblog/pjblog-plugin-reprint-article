import { Controller } from '../utils';
import { Component, Water, Request, Middleware } from '@pjblog/http';
import { numberic } from '@pjblog/core';
import { BlogRePrintArticleEntity } from '../entities/index';
import { HttpNotFoundException } from '@typeservice/exception';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin } from '@pjblog/core';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

interface IBody {
  level: number,
}

@Controller('POST', '/-/article/:id(\\d+)/level')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class LevelArticleController extends Component<number, IBody> {
  public readonly manager: EntityManager;
  constructor(req: Request<IBody>) {
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
    const data = this.req.body;
    const article = this.getCache<LevelArticleController, 'checkExists'>('checkExists');
    article.level = data.level;
    article.gmt_modified = new Date();
    return this.manager.getRepository(BlogRePrintArticleEntity).save(article);
  }
}