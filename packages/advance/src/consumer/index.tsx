import dayjs from 'dayjs';
import { Create } from './create';
import { request } from "../request";
import { ColumnsType } from "antd/es/table";
import { PropsWithoutRef, useCallback, useEffect, useMemo, useState } from "react";
import { Button, message, Popconfirm, Table, Col, Row, Typography } from "antd";

interface IData {
  id: number,
  status: number,
  domain: string,
  code: string,
  ctime: string | Date,
  mtime: string | Date,
  token: string
}
interface IResponse {
  total: number,
  dataSource: IData[],
}

export default function() {
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [dataSource, setDataSource] = useState<IData[]>([]);
  const getList = useCallback((p: number) => {
    request.get<IResponse>('/-/consumers', { 
      params: {
        page: p,
        size
      } 
    }).then((res) => {
      setTotal(res.data.total);
      setDataSource(res.data.dataSource);
    }).catch(e => message.error(e.message));
  }, [setTotal, setDataSource, size]);

  const columns = useMemo<ColumnsType<IData>>(() => {
    return [
      {
        title: '域名',
        dataIndex: 'domain',
        render(domain: string) {
          return <Typography.Link href={domain} target="_blank">{domain}</Typography.Link>
        }
      },
      {
        title: '文章ID',
        width: 300,
        render(_: IData) {
          return <Typography.Link href={_.domain + '/article/' + _.code} target="_blank">{_.code}</Typography.Link>
        }
      },
      {
        title: '转载编码',
        dataIndex: 'token',
        ellipsis: true,
        render(token: string) {
          return <Typography.Text ellipsis copyable={{ text: token }}>{token}</Typography.Text>
        }
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render(status: number) {
          switch (status) {
            case 0: return '待投送';
            case 1: return '审核中';
            case 2: return '成功';
            case -1: return '拒绝';
          }
        }
      },
      {
        title: '创建时间',
        dataIndex: 'ctime',
        width: 180,
        render(time: string | Date) {
          return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
        }
      },
      {
        title: '修改时间',
        dataIndex: 'mtime',
        width: 180,
        render(time: string | Date) {
          return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
        }
      },
      {
        title: '操作',
        width: 100,
        render(_: IData) {
          if (![0, 1].includes(_.status)) return;
          return <GiveUp id={_.id} reload={() => getList(page)} />
        }
      }
    ]
  }, []);

  useEffect(() => getList(page), [getList, page]);

  return <Row gutter={[24, 24]}>
    <Col span={24}>
      <Create reload={() => getList(1)} />
    </Col>
    <Col span={24}>
      <Table 
        size="middle"
        rowKey="id" 
        dataSource={dataSource} 
        columns={columns} 
        pagination={{
          current: page,
          pageSize: size,
          total: total,
          onChange: (p, s) => {
            setPage(p);
            setSize(s);
          },
        }}
      />
    </Col>
  </Row>
}

function GiveUp(props: PropsWithoutRef<{ id: number, reload: () => void }>) {
  const del = useCallback(() => {
    request.delete('/-/consumer/' + props.id)
      .then(props.reload)
      .then(() => message.success('删除成功'))
      .catch(e => message.error(e.message));
  }, [props.id, props.reload]);
  return <Popconfirm title="确定要删除此转载？" okText="删除" cancelText="保留" onConfirm={del}>
    <Button danger>删除</Button>
  </Popconfirm>
}