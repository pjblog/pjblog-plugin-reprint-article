import { Controller } from '../utils';
import { Component, Water, Body, Middleware } from '@pjblog/http';
import { BlogRePrintArticleEntity } from '../entities/index';
import { HttpNotFoundException } from '@typeservice/exception';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin } from '@pjblog/core';
import type Prints from '..';

type IResponse = number;
interface IBody {
  level: number,
  code: string,
}

@Controller('PUT', '/-/article')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class AddArticleController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return Date.now();
  }

  @Water()
  public checkExists(@Body() data: IBody) {
    return async () => {
      const repo = this.manager.getRepository(BlogRePrintArticleEntity);
      const total = await repo.count({
        where: {
          code: data.code,
        }
      })
      if (total) throw new HttpNotFoundException('文章已存在');
    }
  }

  @Water({ stage: 1 })
  public save(@Body() data: IBody) {
    return async () => {
      const article = new BlogRePrintArticleEntity();
      article.code = data.code;
      article.level = data.level;
      article.gmt_create = new Date();
      article.gmt_modified = new Date();
      await this.manager.getRepository(BlogRePrintArticleEntity).save(article);
    }
  }
}