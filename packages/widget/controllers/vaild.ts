import { Controller } from '../utils';
import { Component, Water, Body } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { HttpNotFoundException, HttpNotAcceptableException } from '@typeservice/exception';
import { decode } from '../utils';
import type Prints from '../index';

interface IResponse {
  timestamp: number
}

interface IBody {
  domain: string,
  code: string,
  token: string,
}

@Controller('POST', '/vaild')
export class VaildController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return {
      timestamp: Date.now(),
    }
  }

  @Water()
  public decode(@Body() data: IBody) {
    return () => decode(this.manager, data.token);
  }

  @Water({ stage: 1 })
  public check() {
    return async (context: IResponse, id: string) => {
      const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
      const entity = await repo.findOne({
        where: { code: id }
      })
      if (!entity) throw new HttpNotFoundException('找不到转载码');
      if (entity.status === 1) throw new HttpNotAcceptableException('已验证的转载码');
      if (entity.status !== 0) throw new HttpNotAcceptableException('非法操作');
      return entity;
    }
  }

  @Water({ stage: 2 })
  public checkable(@Body() data: IBody) {
    return (context: IResponse, entity: BlogRePrintConsumerEntity) => {
      if (entity.target_domain !== data.domain || entity.target_article_code !== data.code) {
        throw new HttpNotAcceptableException('非法操作');
      }
      return entity;
    }
  }

  @Water({ stage: 3 })
  public save() {
    const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
    return async (context: IResponse, entity: BlogRePrintConsumerEntity) => {
      entity.status = 1;
      entity.gmt_modified = new Date();
      return await repo.save(entity);
    }
  }
}