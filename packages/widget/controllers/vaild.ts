import { Controller } from '../utils';
import { Component, Water, Request } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { HttpNotFoundException, HttpNotAcceptableException } from '@typeservice/exception';
import { decode } from '../utils';
import { getNode } from '@pjblog/manager';
import { TypeORM } from '@pjblog/typeorm';
import type { EntityManager } from 'typeorm';

interface IResponse {
  timestamp: number
}

interface IBody {
  domain: string,
  code: string,
  token: string,
}

@Controller('POST', '/vaild')
export class VaildController extends Component<IResponse, IBody> {
  public readonly manager: EntityManager;
  constructor(req: Request<IBody>) {
    super(req, { timestamp: Date.now() });
    this.manager = getNode(TypeORM).value.manager;
  }

  @Water(1)
  public decode() {
    const data = this.req.body;
    return decode(this.manager, data.token);
  }

  @Water(2)
  public async check() {
    const id = this.getCache<VaildController, 'decode'>('decode');
    const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
    const entity = await repo.findOne({
      where: { code: id }
    })
    if (!entity) throw new HttpNotFoundException('找不到转载码');
    if (entity.status === 1) throw new HttpNotAcceptableException('已验证的转载码');
    if (entity.status !== 0) throw new HttpNotAcceptableException('非法操作');
    return entity;
  }

  @Water(3)
  public checkable() {
    const data = this.req.body;
    const entity = this.getCache<VaildController, 'check'>('check');
    if (entity.target_domain !== data.domain) {
      throw new HttpNotAcceptableException('非法操作');
    }
  }

  @Water(4)
  public save() {
    const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
    const entity = this.getCache<VaildController, 'check'>('check');
    entity.status = 1;
    entity.gmt_modified = new Date();
    return repo.save(entity);
  }
}