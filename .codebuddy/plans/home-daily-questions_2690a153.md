---
name: home-daily-questions
overview: 将首页「为你推荐」区块改造为「今日一问」，每天生成 2~3 个宠物相关问题，用户点击右侧按钮跳转到 AI 问答页并自动发送该问题。
todos:
  - id: home-daily-questions
    content: 重构 home/index.vue「今日一问」数据层：替换 questionGroups 问题库、更新 dailyQuestions computed、补充 useRouter 导入
    status: completed
  - id: home-template-update
    content: 更新 home/index.vue 模板：标题改为「今日一问」、卡片展示问题文字、按钮点击跳转 /ai-assistant 并携带 query.q、替换图标为 Promotion
    status: completed
    dependencies:
      - home-daily-questions
  - id: ai-auto-send
    content: 修改 ai/index.vue：onMounted 读取 route.query.q，自动填入输入框并触发 sendMessage
    status: completed
---

## 用户需求

将首页右侧「为你推荐」区块重新设计为「今日一问」功能模块。

## 产品概述

在首页侧边栏展示一组每日自动轮换的宠物相关问题（2~3 个），用户点击问题右侧的跳转按钮后，自动导航到 AI 问答页，并将该问题预填并自动发送，帮助用户快速获得 AI 解答。

## 核心功能

- **今日一问数据**：维护一个多组宠物问题库，每组包含 2~3 条问题，通过当天日期计算索引每日自动切换，同一天内内容保持不变
- **卡片展示**：每道问题以独立卡片呈现，显示问题文字，右侧配有圆形跳转按钮，交替使用黄色/白色卡片背景以保持视觉一致
- **一键跳转提问**：点击按钮后跳转至 `/ai-assistant` 路由，通过 URL query 参数（`?q=问题内容`）将问题带入 AI 页面
- **AI 页面自动发送**：AI 问答页在 `onMounted` 时检测 `route.query.q`，若存在则自动填入输入框并触发发送，无需用户手动操作

## 技术栈

现有项目：Vue 3 + TypeScript + Element Plus，沿用现有代码结构，最小改动。

## 实现方案

### 策略

通过 Vue Router 的 query 参数在两个页面间传递问题文本。首页负责"选题+跳转"，AI 页负责"接收+自动发送"，两者解耦，互不干扰。

### 关键决策

- **路由传参**：使用 `router.push({ name: 'ai-assistant', query: { q: question } })` 传递问题，简单可靠，刷新后不会重复发送（AI 页 `onMounted` 仅触发一次）
- **数据结构**：将 `recommendationGroups` 替换为 `questionGroups`，每组元素只需 `{ question: string; isYellow: boolean }`，去掉原有的 `tags` 字段，结构更简洁
- **`useRouter` 补充**：`home/index.vue` 现已引入 `useRoute`，只需额外引入 `useRouter` 即可，无需新增依赖
- **图标替换**：将 `VideoPlay` 图标替换为 `Promotion`（发送箭头），语义上更符合「去提问」的交互意图；`ai/index.vue` 中已有此图标，直接复用

### 性能说明

- 计算属性 `dayIndex` / `dailyQuestions` 为纯同步计算，无任何 I/O，开销极小
- AI 页 `onMounted` 中自动发送仅在有 query 参数时触发，不影响正常进入的流程

## 实现细节

- `home/index.vue`：`import { useRoute, useRouter }` 补充 `useRouter`；替换数据层；更新模板；更换图标导入为 `Promotion`（若 `VideoPlay` 不再使用则移除）；复用现有 `.feature-item`、`.yellow-bg`、`.white-bg`、`.play-btn` 样式，无需新增样式
- `ai/index.vue`：`import { ref, nextTick, onMounted }` 补充 `onMounted`；引入 `useRoute`；在 `onMounted` 中读取 `route.query.q`，若非空则赋值 `userInput` 并调用 `sendMessage()`

## 目录结构

```
frontend/src/views/
├── home/
│   └── index.vue   # [MODIFY] 替换 recommendationGroups 为 questionGroups；更新 dailyQuestions computed；
│                   # 模板中区块标题改为「今日一问」，移除 see-all，更新卡片渲染逻辑；
│                   # 点击按钮调用 router.push 跳转并携带 query.q；补充导入 useRouter + Promotion 图标
└── ai/
    └── index.vue   # [MODIFY] 补充导入 onMounted + useRoute；
                    # 在 onMounted 中检测 route.query.q，自动填入并发送
```