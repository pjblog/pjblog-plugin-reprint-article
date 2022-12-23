import { Col, Row, Table, Select, message, Button, Popconfirm, Typography, Tag } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { PropsWithoutRef, useCallback, useEffect, useMemo, useState } from 'react';
import { request } from '../request';
import { Search } from './search';
interface IArticle {
  title: string,
  code: string,
  level: number,
  id: number,
}
interface IResponse {
  total: number,
  dataSource: IArticle[],
}
export default function() {
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [dataSopurce, setDataSource] = useState<IArticle[]>([]);
  const getDataSource = useCallback((p: number) => {
    request.get<IResponse>('/-/articles', {
      params: {
        page: p, size
      }
    })
      .then(res => {
        setTotal(res.data.total);
        setDataSource(res.data.dataSource);
      })
  }, [setTotal, setDataSource, size])

  const columns = useMemo<ColumnsType<IArticle>>(() => {
    return [
      {
        title: '类型',
        width: 100,
        render(_: IArticle) {
          return <Level value={_.level} id={_.id} reload={() => getDataSource(page)}  />
        }
      },
      {
        title: '标题',
        render(_: IArticle) {
          return <Typography.Link href={'/article/' + _.code} target="_blank">{_.title}</Typography.Link>
        }
      },
      {
        title: 'Code',
        dataIndex: 'code',
        width: 330,
      },
      {
        title: '操作',
        width: 100,
        render(_: IArticle) {
          return <Delit id={_.id} reload={() => getDataSource(page)} />
        }
      }
    ]
  }, [getDataSource]);

  useEffect(() => {
    getDataSource(page);
  }, [page, size]);


  return <Row gutter={[24, 24]}>
    <Col span={24}><Search reload={() => getDataSource(1)} /></Col>
    <Col span={24}>
      <Table 
        rowKey="code" 
        dataSource={dataSopurce} 
        columns={columns} 
        pagination={{
          current: page,
          pageSize: size,
          total: total,
          onChange: ((p, s) => {
            setPage(p);
            setSize(s);
          })
        }}
      />
    </Col>
  </Row>
}

function Level(props: PropsWithoutRef<{ value: number, id: number, reload: () => void }>) {
  const change = useCallback((v: number) => {
    request.post('/-/article/' + props.id + '/level', { level: v })
      .then(props.reload)
      .then(() => message.success('切换等级成功'))
      .catch(e => message.error(e.message));
  }, [props.id, props.reload])
  return <Select value={props.value} onChange={change} options={[
    {
      label: '申请转载',
      value: 0
    },
    {
      label: '公开转载',
      value: 1,
    }
  ]} />
}

function Delit(props: PropsWithoutRef<{ id: number, reload: () => void }>) {
  const del = useCallback(() => {
    request.delete('/-/article/' + props.id)
      .then(props.reload)
      .then(() => message.success('删除文章成功'))
      .catch(e => message.error(e.message));
  }, [props.id, props.reload])

  return <Popconfirm
    title="确定删除这篇文章？删除后文章禁止转载！"
    okText="删除"
    cancelText="保留"
    onConfirm={del}
    placement="left"
  ><Button danger>删除</Button></Popconfirm>
}