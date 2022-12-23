import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import 'antd/dist/reset.css';

let app: ReactDOM.Root;

interface TConfigs {
  abc: number
}

export async function bootstrap() {}
export async function update(props: TConfigs) {}

export async function mount(props: TConfigs) {
  app = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);
  app.render(<App />);
}

export async function unmount(props: TConfigs) {
  if (app) {
    app.unmount();
  }
}
// 测试启动
if (!window.__POWERED_BY_QIANKUN__) {
  mount({
    abc: 10
  });
}