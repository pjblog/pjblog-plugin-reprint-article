import Articles from './article';
import Provider from './provider';
import Consumer from './consumer';
import { Tabs, ConfigProvider, message } from 'antd';
import { useState } from 'react';
import { StyleProvider } from '@ant-design/cssinjs';
const menus = [
  {
    label: '文章',
    key: 'article'
  },
  {
    label: '我收到的转载申请',
    key: 'provider'
  },
  {
    label: '我创建的转载',
    key: 'consumer'
  }
]

message.config({
  // @ts-ignore
  getContainer: () => document.getElementById('container'),
})

export default function App() {
  const [key, setKey] = useState<string>('article');
  // @ts-ignore
  return <ConfigProvider getPopupContainer={() => document.getElementById('container')}>
    <StyleProvider hashPriority="high">
      <div className="app" id="container">
        <Tabs items={menus} activeKey={key} type="card" onChange={e => setKey(e)} />
        {key === 'article' && <Articles />}
        {key === 'provider' && <Provider />}
        {key === 'consumer' && <Consumer />}
      </div>
    </StyleProvider>
  </ConfigProvider>
  
}