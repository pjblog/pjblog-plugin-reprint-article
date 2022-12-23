import { Controller, createRequest } from '../utils';
import { Component, Water, Middleware, Param } from '@pjblog/http';
import { BlogRePrintProviderEntity } from '../entities';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic } from '@pjblog/core';
import { HttpNotAcceptableException } from '@typeservice/exception';
import type Prints from '..';

interface IResponse {
  invaild: boolean
}

@Controller('POST', '/-/provider/:id(\\d+)/refuse')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class RefuseProviderController extends Component<Prints, IResponse> {
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
  public post() {
    return async (context: IResponse, task: BlogRePrintProviderEntity) => {
      const request = createRequest(task.domain);
      const res = await request.post<{ invaild: boolean }>('/consumer/refuse', {
        token: task.token,
      });
      context.invaild = res.data.invaild;
      return task;
    }
  }

  @Water({ stage: 4 })
  public save() {
    return async (context: IResponse, task: BlogRePrintProviderEntity) => {
      task.status = context.invaild ? -2 : -1;
      task.gmt_modified = new Date();
      return await this.manager.getRepository(BlogRePrintProviderEntity).save(task);
    }
  }
}