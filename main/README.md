# Psy Assistant Agent

A configurable Next.js scaffold for building AI Agent homepages with a built-in chat interface powered by [Deep Chat](https://github.com/OvidijusParsiunas/deep-chat).

## Configuration

> Update the value in thie part will change the value on the app automatically😎.
> 
> 修改此处的 Value，程序中对应的值会自动更新。

* **homepageName**
  * **description:** Display name shown in the header, footer, and page title
  * **value:** `"DimSumChatbot"`

* **fullName**
  * **description:** Full agent name shown on the profile card
  * **value:** `"多语种智能助理 DimSumChatbot"`

* **twitterUrl**
  * **description:** Twitter/X profile URL shown in the footer
  * **value:** `"https://x.com/0xleeduckgo"`

* **twitterNicename**
  * **description:** Display name for the Twitter link in the footer
  * **value:** `"leeduckgo@NonceGeek"`

* **descriptionMarkdown**
  * **description:** Agent description in markdown (supports bold, links, newlines)
  * **value:** `"A multilingual smart assistant — DimSumChatbot helps you chat across languages and easily experience cultures from around the world.\n多语种智能助理 DimSumChatbot，支持多种语言对话，助你轻松体验多国文化。"`

* **freeTierDescription**
  * **description:** Description text for the free tier card
  * **value:** `"Chat with the DimSumChatbot for free. \n与 DimSumChatbot 免费聊天！"`

* **freeTierLink**
  * **description:** Link target for the free tier button
  * **value:** `"/chat"`

* **agentTags**
  * **description:** Array of tag labels shown on the profile card
  * **value:** `["language", "international"]`

* **premiumTierDescription**
  * **description:** Description for the premium tier card (supports markdown with images and links)
  * **value:** ` "💡微信扫码进一步沟通：\n![my_qr_code](https://dimsum-utils.oss-cn-guangzhou.aliyuncs.com/leeduckgo/qr_code2.png)\n或者给我发送私信：[https://x.com/0xleeduckgo](https://x.com/0xleeduckgo)"`

* **chatbotDescription**
  * **description:** Subtitle text on the `/chat` page
  * **value:** `"Talk to PsyAssistant if you have any questions."`

* **chatbotIntroMessage**
  * **description:** Initial greeting message in the chat window
  * **value:** `"你好！我是心理学助手 PsyAssistant~ 你有什么问题都可以问我哦❤️~"`

* **chatApiUrl**
  * **description:** Backend API endpoint for the chat
  <!-- * **value:** `"http://localhost:8000/api/search_and_chat"` -->
  * **value:** `"https://api.lang-bot.aidimsum.com/api/chat"`

* **chatLib**
  * **description:** TF-IDF library name used by the search_and_chat RAG endpoint
  * **value:** `"tfidf"`

* **searchMode**
  * **description:** search mode of the Chatbot, tfidf or vector
  * **value:** `"vector"`

* **Prompts**
  * **prompt1:** 
    > 你是一个**专业心理咨询师**，当用户提出心理相关的问题时，你要用 **藏传佛教的世界观与心性观** 来理解与回应。
    > 在回答中，你需要：    
    >
    > 1. 以**藏传佛教的思维方式**来审视和解读问题，如：
    >   - 生命无常与痛苦的缘起性空
    >   - 对“心”的觉察与自性清净的理解
    >   - 通过慈悲、觉知、止观等方法引导用户自我觉醒与解脱  
    >   - 内在烦恼（贪嗔痴）不是个人失败，而是感受与知见的构造物，需要智慧去观察和了解  [oai_citation:0‡维基百科](https://zh.wikipedia.org/wiki/%E6%85%88_%28%E4%BD%9B%E6%95%99%29?utm_source=chatgpt.com)
    >
    > 2. 在专业心理咨询框架下提供支持与引导：
    >   - 先用**共情与接纳**回应用户的感受
    >   - 结合藏传佛教及心理学（如正念觉察、观照习气等）给出**具体的实践建议**           
    >
    > 3. 尊重用户信仰与判断，不强加宗教观点：
    >   - 以佛法智慧辅助理解，而不是灌输宗教教义
    >   - 给出对用户有帮助，可立即实践的建议
    >
    > 请注意，回答中无需给出参考资料。
    > 请注意，在回答中不要出现藏传佛教字样。
    >
    > 请注意，回答请在 30 个字以内。

## Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
git clone <your-repo-url>
cd main
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm run start
```

## Project Structure

```
main/
├── app/
│   ├── page.tsx              # Homepage
│   ├── chat/page.tsx         # Chat page (Deep Chat UI)
│   ├── layout.tsx            # Root layout with providers
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui base components
│   ├── header.tsx            # Site header with navigation
│   ├── agent-profile-card.tsx # Agent profile card component
│   ├── free-tier-card.tsx    # Free tier feature card
│   ├── premium-tier-card.tsx # Premium tier feature card
│   ├── theme-provider.tsx    # Theme provider (light/dark)
│   └── theme-toggle.tsx      # Theme toggle button
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions
├── public/                   # Static assets (avatar, icons)
└── package.json              # Dependencies and config
```

## Available Scripts

```bash
npm run dev            # Start dev server with Turbopack
npm run build          # Production build
npm run start          # Start production server
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix lint issues
npm run format         # Format with Prettier
npm run format:check   # Check formatting
```

## DimSum Pet (`/pet`)

### OSS CORS for remote voice packs

`/pet` 支持通过 URL 参数加载远程语音包 zip，例如：

```
https://lang-bot.aidimsum.com/pet?audio=https://alioss.aidimsum.com/mochi/voice-pack-example.zip
```

页面用浏览器 `fetch` 下载该 zip。资源可以在地址栏直接打开下载，并不等于允许跨域 JS 读取。若控制台出现：

> Access to fetch at '…' from origin '…' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

说明托管语音包的阿里云 OSS Bucket **尚未配置 CORS**。按下面步骤开启即可。

### 1. 进入对应 Bucket

1. 打开 [OSS 控制台](https://oss.console.aliyun.com/)
2. 找到绑定自定义域名（如 `alioss.aidimsum.com`）的 Bucket
3. 进入该 Bucket

### 2. 打开 CORS 设置

左侧：**数据安全** → **跨域设置（CORS）**  
（部分界面在 **权限管理** → **跨域设置**）

点击 **创建规则** / **设置**。

### 3. 推荐规则

| 项 | 建议值 |
| --- | --- |
| **来源 (AllowedOrigins)** | `https://lang-bot.aidimsum.com` |
| **允许 Methods** | `GET`、`HEAD` |
| **允许 Headers** | `*` |
| **暴露 Headers** | 可留空，或按需加 `ETag`、`Content-Length` |
| **缓存时间 (Max-Age)** | `600` 或 `3600` |

本地开发可再加一条来源，例如 `http://localhost:8000` / `http://localhost:3000`。  
`AllowedOrigins` 只写源，不要带路径（写成 `https://lang-bot.aidimsum.com`，不要写成 `…/pet`）。

生产环境优先写明确域名；`*` 仅建议用于临时测试。

### 4. 验证

规则通常很快生效。用带 `?audio=` 的页面地址打开，在 DevTools → Network 中查看 zip 请求，响应头应包含：

```
Access-Control-Allow-Origin: https://lang-bot.aidimsum.com
```

或用命令行：

```bash
curl -I -H "Origin: https://lang-bot.aidimsum.com" \
  "https://alioss.aidimsum.com/mochi/voice-pack-example.zip"
```

响应里应能看到 `Access-Control-Allow-Origin`。

### 注意

- 改的是 **Bucket 的 CORS**，不是域名本身。若前面还有 CDN，有时还需在 CDN 侧放行或透传 CORS 头。
- 对象仍须可读（公共读或签名 URL）；CORS 只解决「别的网站的 JS 能不能读响应」。
- 下载进度条依赖响应中的 `Content-Length`；OSS 一般会返回该头。

## Tech Stack

- [Next.js](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) — UI component library
- [Deep Chat](https://github.com/OvidijusParsiunas/deep-chat) — AI chat component
- [next-themes](https://github.com/pacocoursey/next-themes) — Dark/light mode

## License

MIT
