# APS Design Admin Demo

基于 `aps-design-pro` 的 Vue 3 管理后台演示项目，包含电商业务页面、系统管理页面、组件案例和 JSON 数据契约示例。

## 本地运行

```bash
pnpm install
pnpm dev
```

## 构建验证

```bash
pnpm build
```

项目通过 npm 安装组件库，不依赖组件库源码目录：

```json
{
  "dependencies": {
    "aps-design-pro": "^0.1.2"
  }
}
```

## 开源许可

本项目采用 [MIT License](./LICENSE) 开源。
