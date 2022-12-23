import dayjs from 'dayjs';
import { Button, message, Popconfirm, Table, Col, Row, Space, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { PropsWithoutRef, useCallback, useEffect, useMemo, useState } from "react";
import { request } from "../request";

interface IData {
  id: number,
  status: number,
  domain: string,
  code: string, // 文章code
  ctime: string | Date,
  mtime: string | Date,
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
    request.get<IResponse>('/-/providers', { params: {
      page: p,
      size
    } })
      .then((res) => {
        setTotal(res.data.total);
        setDataSource(res.data.dataSource);
      }).catch(e => message.error(e.message));
  }, [setTotal, setDataSource, size]);

  const columns = useMemo<ColumnsType<IData>>(() => {
    return [
      {
        title: '来源域名',
        dataIndex: 'domain',
        render(domain: string) {
          return <Typography.Link href={domain} target="_blank">{domain}</Typography.Link>
        }
      },
      {
        title: '转载文章',
        dataIndex: 'code',
        width: 300,
        render(code) {
          return <Typography.Link href={'/article/' + code} target="_blank">{code}</Typography.Link>
        }
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render(status: number) {
          switch (status) {
            case 0: return '申请中';
            case 1: return '已同意';
            case -1: return '已拒绝';
            case -2: return '失效';
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
        width: 200,
        render(state: IData) {
          if (state.status !== 0) return null;
          return <Space>
            <Agree id={state.id} reload={() => getList(page)} />
            <Refuse id={state.id} reload={() => getList(page)} />
          </Space>
        }
      }
    ]
  }, [getList, page]);

  useEffect(() => getList(page), [getList, page]);

  return <Row gutter={[24, 24]}>
    <Col span={24}>
      <Table 
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

function Agree(props: PropsWithoutRef<{ id: number, reload: () => void }>) {
  const submit = useCallback(() => {
    request.post<{ invaild: boolean }>('/-/provider/' + props.id + '/agree')
      .then(({ data: { invaild } }) => {
        if (invaild) return message.warning('申请已失效');
        return message.success('已同意');
      })
      .then(props.reload)
      .catch(e => message.error(e.message))
  }, [props.id, props.reload])
  return <Popconfirm title="确定同意？" okText="同意" cancelText="再想想" onConfirm={submit}>
    <Button type="primary">同意</Button>
  </Popconfirm>
}

function Refuse(props: PropsWithoutRef<{ id: number, reload: () => void }>) {
  const submit = useCallback(() => {
    request.post<{ invaild: boolean }>('/-/provider/' + props.id + '/refuse')
      .then(({ data: { invaild } }) => {
        if (invaild) return message.warning('申请已失效');
        return message.success('已拒绝');
      })
      .then(props.reload)
      .catch(e => message.error(e.message))
  }, [props.id, props.reload])
  return <Popconfirm title="确定拒绝？" okText="拒绝" cancelText="再想想" onConfirm={submit}>
    <Button type="primary" danger>拒绝</Button>
  </Popconfirm>
}