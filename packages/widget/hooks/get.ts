import { BlogArticleEntity, ArticleDetail, Configs } from '@pjblog/core';
import { getWaterFall } from '@pjblog/http';
import { getNode } from '@pjblog/manager';
import { Context } from 'koa';
import { BlogRePrintProviderEntity, BlogRePrintArticleEntity } from '../entities';
import type RePrints from '..';
import type { EntityManager } from 'typeorm';

interface IArticle {
  prints: {
    total: number,
    token: string,
    level: number,
  },
}

export function getReprints(widget: RePrints) {
  const water = getWaterFall(ArticleDetail);

  water.add('addPrints', {
    after: 'format',
    async callback(ctx: Context, context: IArticle, article: BlogArticleEntity) {
      const level = await getArticleAllowedLevel(widget.connection.manager, article.article_code);
      if (level === -1) {
        context.prints = {
          total: 0,
          token: null,
          level: -1
        }
      } else {
        const repo = widget.connection.manager.getRepository(BlogRePrintProviderEntity);
        const count = await repo.count({
          where: {
            local_article_code: article.article_code,
            status: 1
          }
        })
        const configs = getNode(Configs);
        const _configs = await configs.getCache('configs').get({}, widget.connection.manager);
        context.prints = {
          total: count,
          level,
          token: Buffer.from(JSON.stringify({ 
            domain: _configs.blog_domain, 
            code: article.article_code,
          })).toString('base64'),
        };
      }
      return article;
    }
  })

  return () =>  water.del('addPrints');
}

async function getArticleAllowedLevel(manager: EntityManager, code: string) {
  const repo = manager.getRepository(BlogRePrintArticleEntity);
  const res = await repo.findOne({
    where: {
      code
    }
  })
  if (!res) return -1;
  return res.level;
}