import { DelControlArticle, BlogArticleEntity } from '@pjblog/core';
import { getWaterFall } from '@pjblog/http';
import { Context } from 'koa';
import { BlogRePrintArticleEntity, BlogRePrintProviderEntity } from '../entities';
import type RePrints from '..';
import type { EntityManager } from 'typeorm';

export function delArticles(widget: RePrints) {
  const water = getWaterFall(DelControlArticle);
  water.add('delRepints', {
    before: 'deleteArticle',
    async callback(ctx: Context, context: number, article: BlogArticleEntity) {
      await removeArticle(widget.connection.manager, article.article_code);
      await removeProviders(widget.connection.manager, article.article_code);
      return article;
    }
  })
  return () => water.del('delRepints');
}

async function removeArticle(manager: EntityManager, code: string) {
  const repo = manager.getRepository(BlogRePrintArticleEntity);
  const articles = await repo.find({
    where: {
      code
    }
  })
  for (let i = 0; i < articles.length; i++) {
    const id = articles[i].id;
    await repo.delete(id);
  }
}

async function removeProviders(manager: EntityManager, code: string) {
  const repo = manager.getRepository(BlogRePrintProviderEntity);
  const providers = await repo.find({
    where: {
      local_article_code: code
    }
  })
  for (let i = 0; i < providers.length; i++) {
    const id = providers[i].id;
    await repo.delete(id);
  }
}