<div align="right">
  <b><a href="#-sorafy-sora-2-prompt-studio-en">English</a></b> | <b><a href="#-sorafy-sora-2-prompt-studio-zh">中文</a></b>
</div>

<a id="-sorafy-sora-2-prompt-studio-en"></a>
# Sorafy: Sora-2 Prompt Studio

> 🚀 **Use for free directly in AI Studio**: [https://ai.studio/apps/drive/1fzpseLjezmFDP9R7EL1IxBfHay53Sqfg](https://ai.studio/apps/drive/1fzpseLjezmFDP9R7EL1IxBfHay53Sqfg)

Sorafy is a Prompt Studio designed specifically for advanced text-to-video models like sora-2. It leverages the power of Gemini to help users brainstorm, iterate, and optimize video generation prompts to create stunning visual effects.

## ✨ Key Features

-   **📝 Structured Prompt Generation**: Transforms your scattered ideas into the highly structured, detail-rich, professional-grade prompts required by the sora-2 model.
-   **🤖 AI-Assisted Iteration**: Interact with a Gemini-powered AI assistant in a chat-like interface to precisely modify and refine the generated prompts.
-   **🖼️ Image Analysis & Idea Generation**: Upload reference images, and the AI can analyze their style, composition, and elements to automatically generate creative video ideas for you.
-   **📂 Session History Management**: Automatically saves every creation session, allowing you to easily review, rename, or continue optimizing from a previous point.
-   **⚙️ Flexible Parameter Control**: Easily set key video parameters like aspect ratio (portrait/landscape) and duration, with support for multi-language UI and light/dark themes.

## 💡 Usage Flow

Sorafy's core workflow is "Ideate -> Generate -> Iterate".

1.  **Start a New Creation (Initial Setup):**
    -   On the initial screen, describe your core video concept (Idea) in natural language.
    -   Set the desired aspect ratio (portrait/landscape) and duration for your video.
    -   (Optional) Upload one or more reference images for the AI to use as a creative foundation. If you're unsure about your idea, you can upload an image first and click "Analyze Image & Suggest Idea" for inspiration.

2.  **Generate the First Prompt:**
    -   Click the "Generate" button. Sorafy will send all your settings to Gemini.
    -   Gemini will follow its built-in sora-2 best practice guidelines to generate the first complete, professional prompt for you.

3.  **Iterate and Refine via Chat:**
    -   Once in the chat view, you can provide feedback to modify the generated result. For example: "Make the color tone colder," "Shoot from a low camera angle," "Change the main character's action to running."
    -   The AI assistant will understand your feedback and generate a new, complete, and optimized prompt, briefly explaining the changes it made.

4.  **Copy and Use:**
    -   When you are satisfied with the result, click the "Copy Prompt" button at the top right of the prompt block to easily paste it into sora-2 or other video generation tools.

5.  **Manage Creation History:**
    -   The sidebar on the left records all your creation sessions. You can start a completely new project by clicking "New Creation" or return to any previous session by clicking on its history entry.

## 🛠️ Run Locally

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your computer.

### Steps

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure API Key:**
    -   Create a file named `.env.local` in the project root directory.
    -   Add your Gemini API key to the file in the following format:
    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

3.  **Start the Application:**
    ```bash
    npm run dev
    ```
The application will start locally, and you can access it in your browser.

---
<br>

<a id="-sorafy-sora-2-prompt-studio-zh"></a>
# Sorafy: Sora-2 Prompt Studio

> 🚀 **直接在 AI Studio 免费使用**: [https://ai.studio/apps/drive/1fzpseLjezmFDP9R7EL1IxBfHay53Sqfg](https://ai.studio/apps/drive/1fzpseLjezmFDP9R7EL1IxBfHay53Sqfg)

Sorafy 是一个专为 sora-2 等先进文生视频模型设计的 Prompt 工作室。它借助 Gemini 的强大能力，帮助用户构思、迭代并优化视频生成提示词，从而创作出令人惊叹的视觉效果。

## ✨ 主要功能

-   **📝 结构化提示词生成**: 将您的零散想法转化为 sora-2 模型所需的高度结构化、细节丰富的专业级 Prompt。
-   **🤖 AI 辅助迭代**: 通过类似聊天的方式，与 Gemini 驱动的 AI 助手互动，对生成的 Prompt 进行精准的修改和完善。
-   **🖼️ 图像分析与灵感激发**: 上传参考图片，AI 可以分析其风格、构图和元素，自动为您生成视频创作灵感。
-   **📂 会话历史管理**: 自动保存您的每一次创作会话，方便您随时回顾、重命名或从之前的节点继续优化。
-   **⚙️ 参数灵活可调**: 轻松设置视频的画幅（横屏/竖屏）、时长等关键参数，并支持多语言界面和明暗主题切换。

## 💡 使用思路

Sorafy 的核心工作流是“构思 -> 生成 -> 迭代”。

1.  **开启新创作 (Initial Setup):**
    -   在初始界面，用自然语言描述你的核心视频构想（Idea）。
    -   设置视频的期望画幅（横屏/竖屏）和时长。
    -   （可选）上传一张或多张参考图片，AI 可以此为灵感基础。如果你不确定 Idea，可以先上传图片，点击“分析图像并建议 Idea”来获得灵感。

2.  **生成首版提示词 (Generate First Prompt):**
    -   点击“生成”按钮。Sorafy 会将你的所有设定发送给 Gemini。
    -   Gemini 会遵循内置的 sora-2 最佳实践指南，为你生成第一版完整、专业的 Prompt。

3.  **对话式迭代优化 (Iterate and Refine):**
    -   进入聊天视图后，你可以针对生成的结果提出修改意见。例如：“让色调更冷峻一些”、“摄像机镜头从低角度拍摄”、“主角的动作改成奔跑”。
    -   AI 助手会理解你的反馈，并生成一个全新的、优化后完整的 Prompt，同时简要说明它做了哪些改动。

4.  **复制并使用 (Copy and Use):**
    -   对结果满意后，点击 Prompt 右上角的“复制提示词”按钮，即可轻松将它粘贴到 sora-2 或其他视频生成工具中使用。

5.  **管理创作历史 (Session History):**
    -   左侧的侧边栏会记录你所有的创作会话。你可以点击“新的创作”开始一个全新的项目，或随时点击历史记录回到之前的任何一次创作中。

## 🛠️ 本地运行

### 环境准备
确保你的电脑上已安装 [Node.js](https://nodejs.org/)。

### 步骤

1.  **安装依赖:**
    ```bash
    npm install
    ```

2.  **配置 API 密钥:**
    -   在项目根目录下创建一个名为 `.env.local` 的文件。
    -   在文件中添加你的 Gemini API 密钥，格式如下：
    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

3.  **启动应用:**
    ```bash
    npm run dev
    ```
应用将在本地启动，你可以在浏览器中访问它。
