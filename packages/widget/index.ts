import { Logger } from '@pjblog/logger';
import { Provider, Consumer, LifeError } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import { Http } from '@pjblog/http';
import { Plugin } from '@pjblog/core';
import { IConfigs } from './utils';

import { 
  BlogRePrintConsumerEntity, 
  BlogRePrintProviderEntity, 
  BlogRePrintArticleEntity,
} from './entities';

import {
  delArticles,
  getReprints,
} from './hooks';

import { 
  AddArticleController,
  AddConsumerController,
  AgreeProviderController,
  ArticlesController,
  ConsumersController,
  DelArticleController,
  DelConsumerController,
  LevelArticleController,
  ProvidersController,
  SearchArticlesController,
  AddProviderController,
  AgreeConsumerController,
  VaildController,
  RefuseProviderController,
  RefuseConsumerController,
  HotController,
} from './controllers';

export * from './controllers';
export * from './entities';
export * from './hooks';
export * from './utils';

@Provider
export default class Prints extends Plugin<IConfigs> {
  @Consumer(Logger) private readonly Logger: Logger;
  @Consumer(TypeORM) private readonly TypeORM: TypeORM;
  @Consumer(Http) private readonly Http: Http;

  get logger() {
    return this.Logger.value;
  }

  get http() {
    return this.Http;
  }

  get connection() {
    return this.TypeORM.value;
  }

  /**
   * 新安装插件时候的生命周期
   * 一般会将数据表描述卸乳
   */
  public async install(): Promise<void> {}

  /**
   * 卸载插件时候专有生命周期
   */
  public async uninstall(): Promise<void> {}

  public onerror(e: LifeError): void {
    this.logger.error(e.stack)
  }

  /**
   * 服务器启动时候逻辑处理
   * @returns 
   */
  public async initialize(): Promise<void | (() => Promise<void>)> {
    await this.TypeORM.synchronize(
      BlogRePrintConsumerEntity, 
      BlogRePrintProviderEntity, 
      BlogRePrintArticleEntity,
    );
    this.http.addController(AddArticleController);
    this.http.addController(AddConsumerController);
    this.http.addController(AgreeProviderController);
    this.http.addController(ArticlesController);
    this.http.addController(ConsumersController);
    this.http.addController(DelArticleController);
    this.http.addController(DelConsumerController);
    this.http.addController(LevelArticleController);
    this.http.addController(ProvidersController);
    this.http.addController(SearchArticlesController);
    this.http.addController(AddProviderController);
    this.http.addController(AgreeConsumerController);
    this.http.addController(VaildController);
    this.http.addController(RefuseProviderController);
    this.http.addController(RefuseConsumerController);
    this.http.addController(HotController);
    const unBindDelArticles = delArticles(this);
    const unBindGetReprints = getReprints(this);
    this.logger.info('pjblog-plugin-reprint-article Initialized.');
    return async () => {
      unBindGetReprints();
      unBindDelArticles();
      this.http.delController(HotController);
      this.http.delController(RefuseConsumerController);
      this.http.delController(RefuseProviderController);
      this.http.delController(VaildController);
      this.http.delController(AgreeConsumerController);
      this.http.delController(AddProviderController);
      this.http.delController(SearchArticlesController);
      this.http.delController(ProvidersController);
      this.http.delController(LevelArticleController);
      this.http.delController(DelConsumerController);
      this.http.delController(DelArticleController);
      this.http.delController(ConsumersController);
      this.http.delController(ArticlesController);
      this.http.delController(AgreeProviderController);
      this.http.delController(AddConsumerController);
      this.http.delController(AddArticleController);
      this.logger.info('pjblog-plugin-reprint-article Terminated.');
    }
  }
}