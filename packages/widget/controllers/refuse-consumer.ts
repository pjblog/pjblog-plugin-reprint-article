import { Controller, decode } from '../utils';
import { Component, Water, Body } from '@pjblog/http';
import { BlogRePrintConsumerEntity } from '../entities/index';
import { HttpNotAcceptableException } from '@typeservice/exception';
import type Prints from '../index';

interface IResponse {
  invaild: boolean
};

interface IBody {
  token: string,
}

// code 转载码
@Controller('POST', '/consumer/refuse')
export class RefuseConsumerController extends Component<Prints, IResponse> {
  get manager() {
    return this.container.connection.manager;
  }

  public response(): IResponse {
    return {
      invaild: false,
    }
  }

  @Water()
  public decode(@Body() data: IBody) {
    return () => decode(this.manager, data.token)
  }

  @Water({ stage: 1 })
  public check() {
    const repo = this.manager.getRepository(BlogRePrintConsumerEntity);
    return async (context: IResponse, id: string) => {
      if (!id) throw new HttpNotAcceptableException('非法token');
      const consumer = await repo.findOne({
        where: {
          code: id
        }
      })
      if (!consumer) {
        context.invaild = true;
      }
      return consumer;
    }
  }

  @Water({ stage: 2 })
  public checkStatus() {
    return (context: IResponse, consumer: BlogRePrintConsumerEntity) => {
      if (consumer.status !== 1) {
        throw new HttpNotAcceptableException('非法操作')
      }
      return consumer;
    }
  }

  @Water({ stage: 3 })
  public save() {
    return async (context: IResponse, consumer: BlogRePrintConsumerEntity) => {
      if (!context.invaild) {
        consumer.status = -1;
        consumer.gmt_modified = new Date();
        return await this.manager.getRepository(BlogRePrintConsumerEntity).save(consumer);
      }
    }
  }
}