# HTools

HTools 是一款部署在 Cloudflare Pages Functions + D1 上的开源工具导航站，可用于搭建工具库、文章页和内容流聚合后台。

<p align="center">
  <a href="https://pages.cloudflare.com/"><img src="https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&amp;logoColor=white&amp;labelColor=555" alt="Cloudflare" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-2ea44f" alt="License: MIT" /></a>
  <a href="https://github.com/shaoyouvip/htools/releases/latest"><img src="https://img.shields.io/github/v/release/shaoyouvip/htools?display_name=tag" alt="Latest Release" /></a>
</p>

<p align="center">
  <a href="https://t.me/lsmkc">Telegram 频道</a> |
  <a href="https://t.me/lsmoo">Telegram 群组</a>
</p>

<p align="center">
  <a href="README_EN.md">English</a> | 简体中文 |
  <a href="https://blog.zrf.me/p/HTools/">部署教程</a>
</p>

## 演示截图

![HTools 前台工具库](public/demo/frontend-tools.png)

![HTools 后台工具库](public/demo/admin-tools.png)

## 功能

- 前台提供工具分类、文章、工具提交和关于页面。
- 后台集中管理工具、文章、RSS 内容源、分类和系统设置。
- RSS 内容可临时浏览或转为站内文章，文章与关于页面支持 Markdown。
- 用户可读取 GitHub 仓库信息并前往 GitHub 创建公开 Issue；后台也可自动补全仓库元数据。
- 工具、文章、内容流条目和自定义内容可由管理员手动推送到 Telegram，并在后台统一浏览、编辑和更新推送记录。
- 支持完整备份与恢复、公开工具订阅源及简体中文 / 英文界面。

## 部署

1. Fork 或导入本仓库到你的 GitHub。
2. 在 Cloudflare Pages 新建项目，并连接你的仓库。
3. Pages 构建设置填写：

```txt
构建命令：npm run build
构建输出目录：dist
```

4. 在 Cloudflare D1 新建数据库，例如 `htools`。
5. 回到 Pages 项目设置，给 Functions 添加 D1 绑定：

```txt
变量名称：DB
D1 数据库：选择你刚创建的数据库
```

6. 按下方环境变量表在 Pages 部署环境中添加需要的变量，并将标记为 Secret 的内容使用加密变量保存。

7. 重新部署 Pages 项目。
8. 打开 `/admin` 登录后台。

首次访问 API 时会自动初始化或升级 D1 表结构，无需手动执行 Migration。数据库默认为空，可在后台导入默认订阅源或手动添加工具。

## 环境变量

项目实际读取的环境变量如下：

| 变量 | 必需 | 建议类型 | 说明 |
| --- | --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | Secret | 后台登录密码和会话签名密钥，建议使用至少 12 位的独立强密码。 |
| `GITHUB_TOKEN` | 否 | Secret | 提高后台读取公开 GitHub 仓库信息的请求限额，建议使用无写入、删除或管理权限的只读 Token；未配置时由管理员浏览器直接请求。 |
| `TURNSTILE_SITE_KEY` | 否，需与私密密钥同时配置 | 普通变量 | 管理员登录页使用的 Turnstile 站点密钥，需与私密密钥同时配置。 |
| `TURNSTILE_SECRET_KEY` | 否，需与站点密钥同时配置 | Secret | 服务端验证 Turnstile 结果的私密密钥；需添加部署域名并重新部署，再到后台开启。 |
| `TGTOKEN` | 否 | Secret | Telegram Bot Token；重新部署后在后台填写接收目标、测试连接并开启。推送只由管理员手动触发。 |

## 本地开发

```bash
npm install
npm run dev
```

如需手动初始化或排查 D1：

```bash
npm run db:init:local
npm run db:init:remote
```

## 数据源

- 默认工具源文件：[public/htools.json](public/htools.json)
- 默认工具源访问地址：[https://raw.githubusercontent.com/shaoyouvip/htools/refs/heads/main/public/htools.json](https://raw.githubusercontent.com/shaoyouvip/htools/refs/heads/main/public/htools.json)
- 当前站点公开源：`/api/htools.json`

默认工具源不会自动写入 D1，可在后台导入该地址或其他站点公开的 `/api/htools.json`。

## SEO 和订阅

- `/sitemap.xml`：公开页面和已发布文章的站点地图。
- `/rss.xml`：已发布文章的 RSS。
- `/rss.json`：已发布文章的 JSON Feed。
