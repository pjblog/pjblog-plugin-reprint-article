import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
@Entity({ name: 'blog_reprint_consumer' })
@Index(['code'], { unique: true })
@Index(['status'])
export class BlogRePrintConsumerEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'integer',
    comment: '用户ID',
    default: 0,
  })
  public uid: number;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '唯一码'
  })
  public code: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: 'token'
  })
  public token: string;

  @Column({
    type: 'integer',
    comment: '转载状态 0 发起转载 1 已验证文章信息 2 转载成功 -1 拒绝转载',
    default: 0,
  })
  public status: number;

  @Column({
    type: 'text',
    comment: '对方域名'
  })
  public target_domain: string;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '对方文章code'
  })
  public target_article_code: string;

  @Column({
    type: 'integer',
    comment: '转入的本站文章ID',
    default: 0,
  })
  public local_article_id: number;

  @Column({
    type: 'timestamp',
    comment: '创建时间'
  })
  public gmt_create: Date;

  @Column({
    type: 'timestamp',
    comment: '更新时间'
  })
  public gmt_modified: Date;
}