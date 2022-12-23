import { Controller, createRequest } from '../utils';
import { Component, Water, Middleware, Param } from '@pjblog/http';
import { BlogRePrintProviderEntity, BlogRePrintArticleEntity } from '../entities';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic, BlogArticleEntity } from '@pjblog/core';
import { HttpNotAcceptableException, HttpNotFoundException } from '@typeservice/exception';
import type Prints from '..';

interface IResponse {
  invaild: boolean,
};

@Controller('POST', '/-/provider/:id(\\d+)/agree')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class AgreeProviderController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return {
      invaild: false
    }
  }

  @Water()
  public check(@Param('id', numberic(0)) id: number) {
    return async () => {
      if (!id) throw new HttpNotAcceptableException('找不到任务');
      const repo = this.manager.getRepository(BlogRePrintProviderEntity);
      const task = await repo.findOne({ where: { id } });
      if (!task) throw new HttpNotAcceptableException('找不到任务');
      return task;
    }
  }

  @Water({ stage: 1 })
  public checkStatus() {
    return (context: IResponse, task: BlogRePrintProviderEntity) => {
      if (task.status !== 0) {
        throw new HttpNotAcceptableException('非法操作');
      }
      return task;
    }
  }

  @Water({ stage: 2 })
  public checkArticleExists() {
    return async (context: IResponse, task: BlogRePrintProviderEntity) => {
      const repo = this.manager.getRepository(BlogArticleEntity);
      const article = await repo.findOne({ 
        where: {
          article_code: task.local_article_code,
        } 
      })
      if (!article) throw new HttpNotFoundException('找不到文章');
      return {
        article,
        task,
      }
    }
  }

  @Water({ stage: 3 })
  public checkRePrintArticle() {
    return async (context: IResponse, options: { 
      article: BlogArticleEntity, 
      task: BlogRePrintProviderEntity 
    }) => {
      const repo = this.manager.getRepository(BlogRePrintArticleEntity);
      const rearticle = repo.findOne({
        where: {
          code: options.article.article_code,
        }
      })
      if (!rearticle) throw new HttpNotFoundException('文章禁止转载');
      return options;
    }
  }

  @Water({ stage: 4 })
  public post() {
    return async (context: IResponse, options: { 
      article: BlogArticleEntity, 
      task: BlogRePrintProviderEntity, 
    }) => {
      const request = createRequest(options.task.domain);
      const res = await request.post<{ invaild: boolean }>('/consumer/agree', {
        token: options.task.token,
        post: {
          title: options.article.article_title,
          content: options.article.article_content,
          summary: options.article.article_summary,
        }
      })
      context.invaild = res.data.invaild;
      return options.task;
    }
  }

  @Water({ stage: 5 })
  public save() {
    return async (context: IResponse, task: BlogRePrintProviderEntity) => {
      task.status = context.invaild ? -2 : 1;
      task.gmt_modified = new Date();
      return await this.manager.getRepository(BlogRePrintProviderEntity).save(task);
    }
  }
}