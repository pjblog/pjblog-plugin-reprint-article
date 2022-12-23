import { Controller } from '../utils';
import { Component, Water, Middleware, Param } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { AutoGetUserInfo, CheckUserLogined, CheckUserIsAdmin, numberic } from '@pjblog/core';
import { HttpNotAcceptableException } from '@typeservice/exception';
import type Prints from '../index';

type IResponse = number;

@Controller('DELETE', '/-/consumer/:id(\\d+)')
@Middleware(AutoGetUserInfo)
@Middleware(CheckUserLogined)
@Middleware(CheckUserIsAdmin)
export class DelConsumerController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return Date.now();
  }

  @Water()
  public check(@Param('id', numberic(0)) id: number) {
    return async () => {
      if (!id) throw new HttpNotAcceptableException('找不到转载数据');
      const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
      const data = await repo.findOne({ where: { id } });
      if (!data) throw new HttpNotAcceptableException('找不到转载数据');
      return data;
    }
  }

  @Water({ stage: 1 })
  public delcheck() {
    return (context: IResponse, data: BlogRePrintConsumerEntity) => {
      if (![0, 1].includes(data.status)) {
        throw new HttpNotAcceptableException('非法操作');
      }
      return data;
    }
  }

  @Water({ stage: 2 })
  public del() {
    return async (context: IResponse, data: BlogRePrintConsumerEntity) => {
      const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
      await repo.delete(data.id);
    }
  }
}