import { Controller, decode } from '../utils';
import { Component, Water, Request } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { HttpNotAcceptableException } from '@typeservice/exception';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

export interface IRefuseConsumerControllerResponse {
  invaild: boolean
};

interface IBody {
  token: string,
}

// code 转载码
@Controller('POST', '/consumer/refuse')
export class RefuseConsumerController extends Component<IRefuseConsumerControllerResponse, IBody> {
  public readonly manager: EntityManager;
  constructor(req: Request<IBody>) {
    super(req, { invaild: false });
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public decode() {
    const data = this.req.body;
    return decode(this.manager, data.token)
  }

  @Water(2)
  public async check() {
    const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
    const id = this.getCache<RefuseConsumerController, 'decode'>('decode');
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
    const consumer = this.getCache<RefuseConsumerController, 'check'>('check');
    if (consumer.status !== 1) {
      throw new HttpNotAcceptableException('非法操作')
    }
  }

  @Water(4)
  public save() {
    const consumer = this.getCache<RefuseConsumerController, 'check'>('check');
    if (!this.res.invaild) {
      consumer.status = -1;
      consumer.gmt_modified = new Date();
      return this.manager.getRepository(BlogRePrintConsumerEntity).save(consumer);
    }
  }
}