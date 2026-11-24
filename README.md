# 测一测 · 小红书小工具

用几个轻量问题，给日常生活找点好玩的想法。这里整理可取得源码的测一测小工具、项目文档、最新上传包和展示素材，后续每天完成的新工具也会同步到这里。

| 项目 | 内容 | 小红书状态（最近核验） |
| --- | --- | --- |
| [小本神仙办事处](projects/little-gods) | 低预算守护神与生活小建议 | 已发布 |
| [理想好友·双人版](projects/friendship-duo) | 两人作答、答题相似度、相处说明书 | 本地完成，未上传 |
| [周末回血方式](projects/weekend-recharge) | 六题找到自己的休息安排 | 已发布 |
| [开工第一步](projects/first-step) | 六题找个容易开始的小动作 | 已发布 |
| [散步取景卡](projects/photo-walk) | 六题领一张街头拍摄任务卡 | 已部署，未送审 |
| [书架盲选](projects/bookshelf-pick) | 六题挑一个阅读方向 | 已发布 |
| [下班切换键](projects/evening-switch) | 六题挑一个下班过渡动作 | 已发布 |
| [你的冬日小仪式](projects/winter-ritual) | 冬日暖心点子与轻量动效 | 工具已发布，介绍笔记提交时审核中 |

原“理想型测试·友情向”单人版已在小红书发布，但当前工作区没有它的完整原始源码。本仓库收录的是独立双人版，不将其冒充为线上单人版。

## 文件怎么用

每个项目的 `README.md` 说明用途、状态及验证范围；`dist/` 是静态页面和本地资源；`release/tool.zip` 是当前归档上传包。日常项目的 `presentation/` 保存图标及封面。`manifest.json` 记录项目状态、AppID和ZIP校验值。

本地预览：`python3 -m http.server 8000 --directory projects/winter-ritual/dist`，打开 http://localhost:8000 。涉及小红书原生能力的功能仍需在平台模拟器及真机中验证。

## 重新打包

运行 `python3 scripts/package.py <项目目录名>`，例如 `python3 scripts/package.py winter-ritual`。脚本将dist中的静态文件压缩到release/tool.zip，入口index.html位于ZIP根目录，并更新校验值。提交平台前按最新官方小工具规范校验。

## 维护

每日新增项目先检查重复，再保存源码、文档、素材、包和验证结果；只把实际审核通过的工具记为已发布。不要加入账号凭据、用户作答记录、个人聊天、内部交接本或本机托管配置。历史备份包保留在本地，不作为当前版本上传。

这些是原创娱乐小测试，用来整理偏好和提供生活点子，不是专业心理量表。未在本仓库声明开源许可；公开展示不自动授予项目素材的商业使用许可。
