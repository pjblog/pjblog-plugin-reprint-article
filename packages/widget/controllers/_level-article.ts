import { Controller } from '../utils';
import { Component, Water, Param, Body, Middleware } from '@pjblog/http';
import { numberic } from '@pjblog/core';
import { BlogRePrintArticleEntity } from '../entities/index';
import { HttpNotFoundException } from '@typeservice/exception';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin } from '@pjblog/core';
import type Prints from '../index';

type IResponse = number;
interface IBody {
  level: number,
}

@Controller('POST', '/-/article/:id(\\d+)/level')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class LevelArticleController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return Date.now();
  }

  @Water()
  public checkExists(@Param('id', numberic(0)) id: number) {
    return async () => {
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
  }

  @Water({ stage: 1 })
  public save(@Body() data: IBody) {
    return async (context: IResponse, article: BlogRePrintArticleEntity) => {
      article.level = data.level;
      article.gmt_modified = new Date();
      await this.manager.getRepository(BlogRePrintArticleEntity).save(article);
    }
  }
}