import { PropsWithoutRef, useEffect, useRef, useState } from "react";
import { message, Select } from 'antd';
import { request } from "../../request";

interface IOption {
  label: string,
  value: string
}

export function Search(props: PropsWithoutRef<{ reload: () => void }>) {
  const timer = useRef<NodeJS.Timer>();
  const [keyword, setkeyword] = useState<string | null>(null);
  const [options, setOptions] = useState<IOption[]>([]);
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!keyword) return;
    timer.current = setTimeout(() => {
      request.post<{ title: string, code: string }[]>('/-/articles/search', { keyword })
        .then(e => {
          const data = e.data;
          setOptions(data.map(({ title, code }) => {
            return {
              label: title,
              value: code,
            }
          }))
        })
        .catch(e => message.error(e.message));
    }, 1000);
  }, [keyword]);

  useEffect(() => {
    if (!value) return;
    request.put('/-/article', { level: 0, code: value })
      .then(props.reload)
      .then(() => message.success('添加文章成功'))
      .catch(e => message.error(e.message))
      .finally(() => {
        setValue(null);
        setOptions([]);
      });
  }, [value])

  return <Select
    showSearch
    size="middle"
    value={value}
    style={{ width: 500 }}
    placeholder="根据文章标题搜索"
    onSearch={e => setkeyword(e)}
    onChange={e => setValue(e)}
    options={options}
    filterOption={false}
  />
}