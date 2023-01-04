import { Controller } from '../utils';
import { Component, Water, Middleware, Request } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic } from '@pjblog/core';
import { HttpNotAcceptableException } from '@typeservice/exception';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';


@Controller('DELETE', '/-/consumer/:id(\\d+)')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class DelConsumerController extends Component<number> {
  public readonly manager: EntityManager;
  constructor(req: Request) {
    super(req, Date.now());
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public async check() {
    const id = numberic(0)(this.req.params.id);
    if (!id) throw new HttpNotAcceptableException('找不到转载数据');
    const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
    const data = await repo.findOne({ where: { id } });
    if (!data) throw new HttpNotAcceptableException('找不到转载数据');
    return data;
  }

  @Water(2)
  public delcheck() {
    const data = this.getCache<DelConsumerController, 'check'>('check');
    if (![0, 1].includes(data.status)) {
      throw new HttpNotAcceptableException('非法操作');
    }
  }

  @Water(3)
  public del() {
    const data = this.getCache<DelConsumerController, 'check'>('check');
    const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
    return repo.delete(data.id);
  }
}