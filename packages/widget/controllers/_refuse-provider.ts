import { Controller, createRequest } from '../utils';
import { Component, Water, Middleware, Request } from '@pjblog/http';
import { BlogRePrintProviderEntity } from '../entities';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic } from '@pjblog/core';
import { HttpNotAcceptableException } from '@typeservice/exception';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

export interface IRefuseProviderControllerResponse {
  invaild: boolean
}

@Controller('POST', '/-/provider/:id(\\d+)/refuse')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class RefuseProviderController extends Component<IRefuseProviderControllerResponse> {
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
    const task = this.getCache<RefuseProviderController, 'check'>('check');
    if (task.status !== 0) {
      throw new HttpNotAcceptableException('非法操作');
    }
  }

  @Water(3)
  public async post() {
    const task = this.getCache<RefuseProviderController, 'check'>('check');
    const request = createRequest(task.domain);
    const res = await request.post<IRefuseProviderControllerResponse>('/consumer/refuse', {
      token: task.token,
    });
    this.res.invaild = res.data.invaild;
  }

  @Water(4)
  public save() {
    const task = this.getCache<RefuseProviderController, 'check'>('check');
    task.status = this.res.invaild ? -2 : -1;
    task.gmt_modified = new Date();
    return this.manager.getRepository(BlogRePrintProviderEntity).save(task);
  }
}