import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: 'blog_reprint_article' })
@Index(['code'], { unique: true })
@Index(['level'])
export class BlogRePrintArticleEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '文章code'
  })
  public code: string;

  @Column({
    type: 'integer',
    comment: '等级 0 申请转载 1 公开转载'
  })
  public level: number;

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