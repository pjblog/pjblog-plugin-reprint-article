import { Button, Input, message, Space } from "antd";
import { PropsWithoutRef, useCallback, useState } from "react";
import { request } from "../request";
export function Create(props: PropsWithoutRef<{ reload: () => void }>) {
  const [value, setValue] = useState<string | undefined>();
  const submit = useCallback(() => {
    if (!value) return;
    request.put('/-/consumer', { base64: value })
      .then(props.reload)
      .then(() => setValue(undefined))
      .then(() => message.success('创建转载码成功'))
      .catch(e => message.error(e.message));
  }, [value, props.reload])
  return <Space>
    <Input value={value} onChange={e => setValue(e.target.value)} placeholder="输入待转载base64编码" style={{ width: 400 }} size="middle" />
    <Button type='primary' onClick={submit}>创建</Button>
  </Space>
}