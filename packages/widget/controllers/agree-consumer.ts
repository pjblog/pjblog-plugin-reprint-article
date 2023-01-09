import { Controller, decode } from '../utils';
import { Component, Water, Request } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { _PostArticleController, TArticlePostProps } from '@pjblog/core';
import { HttpNotAcceptableException } from '@typeservice/exception';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

export interface IAgreeConsumerControllerResponse {
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
export class AgreeConsumerController extends Component<IAgreeConsumerControllerResponse, IBody> {
  public readonly manager: EntityManager;
  constructor(req: Request<IBody>) {
    super(req, { invaild: false, });
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public decode() {
    const data = this.req.body;
    return decode(this.manager, data.token);
  }

  @Water(2)
  public async check() {
    const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
    const id = this.getCache('decode');
    if (!id) throw new HttpNotAcceptableException('非法token');
    const consumer = await repo.findOne({
      where: {
        code: id
      }
    })
    if (!consumer) {
      this.res.invaild = true;
    }
    return consumer;
  }

  @Water(3)
  public checkStatus() {
    const consumer = this.getCache('check');
    if (!this.res.invaild && consumer.status !== 1) {
      throw new HttpNotAcceptableException('非法操作');
    }
  }

  @Water(4)
  public async saveArticle() {
    const data = this.req.body;
    const consumer = this.getCache('check');
    const req = new Request<TArticlePostProps>();
    req.setParam('id', '0');
    req.setState('profile', {
      id: consumer.uid,
    });
    req.setBody({
      title: data.post.title,
      content: data.post.content,
      category: 0,
      tags: [],
      summary: data.post.summary,
      from: consumer.target_domain + '/article/' + consumer.target_article_code,
    });
    const { id } = await this.invoke(_PostArticleController, req);
    return id;
  }

  @Water(5)
  public save() {
    const consumer = this.getCache('check');
    const id = this.getCache('saveArticle');
    if (!this.res.invaild) {
      consumer.status = 2;
      consumer.local_article_id = id;
      consumer.gmt_modified = new Date();
      return this.manager.getRepository(BlogRePrintConsumerEntity).save(consumer);
    }
  }
}