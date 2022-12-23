import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: 'blog_reprint_provider' })
export class BlogRePrintProviderEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'text',
    comment: '授权转载token'
  })
  public token: string;

  @Column({
    type: 'text',
    comment: '对方域名'
  })
  public domain: string;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '文章code'
  })
  public local_article_code: string;

  @Column({
    type: 'integer',
    comment: '转载状态 0 申请中 1 同意 -1 拒绝 -2 失效',
    default: 0,
  })
  public status: number;

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