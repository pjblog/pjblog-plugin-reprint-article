# 概述

自动转载插件。使用条件限制：

1. 双方博客均为`PJBlog`
2. 双方博客均安装了 [pjblog-plugin-reprint-article](https://npmjs.com/pjblog-plugin-reprint-article) 插件

功能流程:

1. 从对方博客文章的详情页获取 转载 `Token`
2. 在已方的`模块 - 高级 - 我创建的转载`中填入输入框创建转载码
3. 将此转载码填入到对象博客文章详情页的转载输入框

此时您的申请对方已收到，根据文章转载权限的设定：

- 如果为**公开转载**，那么在您输入转载码后，文章已自动同步到您的博客
- 如果为**申请转载**，那么需要对方博客管理员在`模块 - 高级 - 我收到的转载申请`中同意或者拒绝

此插件能提高博客用户的粘性，非常值得大家推荐使用。此插件目的为增加博客间的交互与交流。

## 主题处理

插件在文章详情页提供了额外的字段

```ts
interface IArticle {
  ...,
  prints: {
    total: number, // 此文章总转载数
    token: string, // 次文章被转载所需要用到的转载信息base64码
    level: number, // 此文章的转载等级 0: 申请转载 1: 公开转载 -1 禁止转载
  },
}
```

主题开发者可以根据额外的字段来设计。

### 响应申请处理

当用户在自己的平台上生成转载码后，博主需要进行如下处理：

```ts
// e4298148a620fb3ea86aae6043423096 为文章的code编码
request.put('http://127.0.0.1:8866/-/plugin/pjblog-plugin-reprint-article/provider/e4298148a620fb3ea86aae6043423096', {
    "base64": "这里输入转载码"
})
```

请求将返回如下的结构

```ts
{
  "status": 200,
  "data": {
    "level": 0 // 对象本文的转载等级
  }
}
```

### 热门转载文章

插件提供用于侧边栏的热门转载功能

```ts
interface IData {
  title: string,
  code: string,
  count: number,
}

request.get('http://127.0.0.1:8866/-/plugin/pjblog-plugin-reprint-article/hot');

// 响应的数据结构如下
{
  "status": 200,
  "data": [
    {
      "title": "欢迎使用PJBlog",
      "code": "e4298148a620fb3ea86aae6043423096",
      "count": "1"
    }
  ] as IData[]
}
```

## 等级

两种等级的区别为

1. `公开转载` 当用户输入转载码后系统自动同意，能够非常快速将文章同步到用户的网站，无需博主去后台同意。
2. `申请转载` 用户提交转载码后不会立即同步文章，需要博主去后台同意。当同意后文章自动同步到用户博客。

当然，没有在插件后台管理的文章均被认为`禁止转载`