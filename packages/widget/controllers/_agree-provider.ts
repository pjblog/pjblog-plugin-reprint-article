import { Controller, createRequest } from '../utils';
import { Component, Water, Middleware, Request } from '@pjblog/http';
import { BlogRePrintProviderEntity, BlogRePrintArticleEntity } from '../entities';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic, BlogArticleEntity } from '@pjblog/core';
import { HttpNotAcceptableException, HttpNotFoundException } from '@typeservice/exception';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

export interface IAgreeProviderControllerResponse {
  invaild: boolean,
};

@Controller('POST', '/-/provider/:id(\\d+)/agree')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class AgreeProviderController extends Component<IAgreeProviderControllerResponse> {
  public readonly manager: EntityManager;
  constructor(req: Request) {
    super(req, { invaild: false });
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public async check() {
    const id = numberic(0)(this.req.params.id);
    if (!id) throw new HttpNotAcceptableException('找不到任务');
    const repo = this.manager.getRepository(BlogRePrintProviderEntity);
    const task = await repo.findOne({ where: { id } });
    if (!task) throw new HttpNotAcceptableException('找不到任务');
    return task;
  }

  @Water(2)
  public checkStatus() {
    const task = this.getCache('check');
    if (task.status !== 0) {
      throw new HttpNotAcceptableException('非法操作');
    }
  }

  @Water(3)
  public async checkArticleExists() {
    const task = this.getCache('check');
    const repo = this.manager.getRepository(BlogArticleEntity);
    const article = await repo.findOne({ 
      where: {
        article_code: task.local_article_code,
      } 
    })
    if (!article) throw new HttpNotFoundException('找不到文章');
    return article;
  }

  @Water(4)
  public async checkRePrintArticle() {
    const article = this.getCache('checkArticleExists');
    const repo = this.manager.getRepository(BlogRePrintArticleEntity);
      const rearticle = await repo.findOne({
        where: {
          code: article.article_code,
        }
      })
      if (!rearticle) throw new HttpNotFoundException('文章禁止转载');
  }

  @Water(5)
  public async post() {
    const task = this.getCache('check');
    const article = this.getCache('checkArticleExists');
    const request = createRequest(task.domain);
    const res = await request.post<{ invaild: boolean }>('/consumer/agree', {
      token: task.token,
      post: {
        title: article.article_title,
        content: article.article_content,
        summary: article.article_summary,
      }
    })
    this.res.invaild = res.data.invaild;
  }

  @Water(6)
  public save() {
    const task = this.getCache('check');
    task.status = this.res.invaild ? -2 : 1;
    task.gmt_modified = new Date();
    return this.manager.getRepository(BlogRePrintProviderEntity).save(task);
  }
}