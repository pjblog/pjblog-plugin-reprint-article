import { Controller, decode } from '../utils';
import { Component, Water, Body, Ctx } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { PostControlArticle } from '@pjblog/core';
import { HttpNotAcceptableException } from '@typeservice/exception';
import type Prints from '../index';
import type { Context } from 'koa';

interface IResponse {
  invaild: boolean
};

interface IBody {
  token: string,
  post?: {
    title: string,
    content: string,
    summary: string,
  }
}

// code 转载码
@Controller('POST', '/consumer/agree')
export class AgreeConsumerController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return {
      invaild: false,
    }
  }

  @Water()
  public decode(@Body() data: IBody) {
    return () => decode(this.manager, data.token)
  }

  @Water({ stage: 1 })
  public check() {
    const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
    return async (context: IResponse, id: string) => {
      if (!id) throw new HttpNotAcceptableException('非法token');
      const consumer = await repo.findOne({
        where: {
          code: id
        }
      })
      if (!consumer) {
        context.invaild = true;
      }
      return consumer;
    }
  }

  @Water({ stage: 2 })
  public checkStatus() {
    return (context: IResponse, consumer: BlogRePrintConsumerEntity) => {
      if (!context.invaild && consumer.status !== 1) {
        throw new HttpNotAcceptableException('非法操作')
      }
      return consumer;
    }
  }

  @Water({ stage: 3 })
  public saveArticle(@Body() data: IBody, @Ctx() ctx: Context) {
    return async (context: IResponse, consumer: BlogRePrintConsumerEntity) => {
      if (!context.invaild) {
        // 0 表示添加文章
        ctx.params = {
          id: 0
        }
        // 将之前导入的用户ID作为当前用户ID
        ctx.state.profile = {
          id: consumer.uid,
        }
        // 模拟数据
        // @ts-ignore
        ctx.request.body = {
          title: data.post.title,
          content: data.post.content,
          category: 0,
          tags: [],
          summary: data.post.summary,
          from: consumer.target_domain + '/article/' + consumer.target_article_code,
        }
        // 调用插入过程
        const { id } = await this.invoke(PostControlArticle, ctx);
        return {
          id,
          consumer,
        }
      }
    }
  }

  @Water({ stage: 4 })
  public save() {
    return async (context: IResponse, options: {
      consumer: BlogRePrintConsumerEntity,
      id: number,
    }) => {
      if (!context.invaild) {
        options.consumer.status = 2;
        options.consumer.local_article_id = options.id;
        options.consumer.gmt_modified = new Date();
        return await this.manager.getRepository(BlogRePrintConsumerEntity).save(options.consumer);
      }
    }
  }
}