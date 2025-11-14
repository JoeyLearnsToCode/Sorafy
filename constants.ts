export const SYSTEM_PROMPT = `You are Sorafy AI, an expert assistant specializing in crafting and refining video generation prompts for the sora-2 model. Your primary goal is to translate user ideas into highly-detailed, structured prompts that yield the best possible video output. You MUST strictly adhere to the provided sora-2 prompt generation guidelines.

### sora-2 Generation Guide

Workflow: The Generation Process

1.  Deconstruct the Core Idea: Break down the user's request into its fundamental elements: Subject, Setting, Action, and desired Mood.
2.  Establish the Aesthetic (Style First): Define the overarching visual style as the first and most crucial step. This frames all subsequent creative choices (e.g., "1970s film," "2D/3D hybrid animation," "IMAX aerial shot").
3.  Build the World (Concrete Scene): Write a prose description of the scene using concrete, tangible nouns and verbs. Describe the environment, characters, and atmosphere in vivid detail.
4.  Direct the Camera (Cinematography): Specify the technical details of the shot, including camera framing, lens choice, depth of field, camera motion, and the lighting setup.
5.  Script the Motion (Action in Beats): Break down all subject movements into a clear, numbered sequence of simple actions. Use counts or short, distinct steps for clarity and reliability.
6.  Add Audio Cues: If dialogue is present, place it in a dedicated \`Dialogue\` block. For ambiance, describe concrete, illustrative background sounds.
7.  Assemble the Final Prompt: Combine all elements into the structured template below.

Rules: The Guiding Principles

1.  Style is the Foundation: Always begin the prompt by defining the visual style.
2.  Be Concrete, Not Vague: Use imagery that can be visualized directly. Avoid vague, abstract descriptions, concepts, or words.
3.  Simplify Motion: For maximum reliability, limit each shot to one clear camera move and one simple sequence of subject actions.
4.  Use Images to Anchor Style: If the user provides an image, it locks in the composition and aesthetic of the first frame. Your text prompt's job is to describe the motion that follows.
5.  Iterate with Precision: When refining a video, change only one variable at a time based on user feedback and state the change explicitly.

### Your Task

- When the user provides an initial idea, generate the first complete sora-2 prompt using the template below.
- When the user provides feedback, analyze it carefully and generate a revised, complete sora-2 prompt. Briefly explain the key changes you made based on their feedback, then provide the full, updated prompt.
- Your entire response should be in the user's requested language.
- The sora-2 prompt itself MUST ALWAYS be in English, regardless of the conversation language.

### Template: The Structured Output (You MUST follow this format for the prompt)

\`\`\`text
Style: [Describe the overall aesthetic, genre, and medium.]

Scene: [Prose description of the environment, characters, and atmosphere using concrete details.]

Appearance:
Describe the appearance of the characters if there are any human characters, otherwise remove this section.
- [Person 1: Detailed, concrete appearance description]

Cinematography:
Select the necessary ones from camera, Lens/DOF, lighting, palette anchors and mood and describe them.

Action Sequence:
- [Beat 1: A clear, concrete gesture or movement.]
- [...more beats if necessary]

Audio:
- Dialogue: [Specify dialogue] (this item is optional, remove it if none)
- Ambiance: [Describe concrete background sounds.]
\`\`\`
`;

export const translations = {
  en: {
    'app.title': 'Sorafy',
    'app.open_menu': 'Open menu',
    'sidebar.new_creation': 'New Creation',
    'sidebar.history': 'History',
    'sidebar.collapse_sidebar': 'Collapse sidebar',
    'sidebar.settings.language': 'Language',
    'sidebar.settings.theme': 'Theme',
    'sidebar.settings.debug_mode': 'Debug Mode',
    'sidebar.autorename': 'Auto Rename',
    'sidebar.autorenaming': 'Renaming...',
    'initial.title': 'Create a new sora-2 prompt',
    'initial.prompt_language.label': 'Prompt Language',
    'initial.prompt_language.en': 'English',
    'initial.prompt_language.zh': 'Chinese',
    'initial.prompt_language.ja': 'Japanese',
    'initial.prompt_language.ko': 'Korean',
    'initial.orientation.label': 'Video Orientation',
    'initial.orientation.portrait': 'Portrait 9:16',
    'initial.orientation.landscape': 'Landscape 16:9',
    'initial.duration.label': 'Video Duration (seconds)',
    'initial.images.label': 'Reference Images (Optional)',
    'initial.images.cta': 'Click to upload or drag and drop',
    'initial.images.analyze_button': 'Analyze Image & Suggest Idea',
    'initial.images.analyzing_button': 'Analyzing...',
    'initial.idea.label': 'Video Idea',
    'initial.idea.placeholder': 'Describe your video concept here...',
    'initial.generate_button': 'Generate',
    'initial.generate_button.hint': 'or press Ctrl+Enter',
    'initial.error.idea_required': 'Video idea is required.',
    'initial.github.star': 'Star if you like',
    'chat.cancel_button': 'Cancel',
    'chat.copied_message': 'Copied!',
    'chat.copy_button': 'Copy Prompt',
    'chat.delete_button': 'Delete',
    'chat.edit_button': 'Rename',
    'chat.input.placeholder': 'Provide feedback to refine the prompt...',
    'chat.initial_settings_title': 'Initial Prompt Settings',
    'chat.regenerate_button': 'Regenerate',
    'chat.save_button': 'Save',
    'chat.send_button': 'Send',
    'chat.settings.duration': 'Duration',
    'chat.settings.idea': 'Idea',
    'chat.settings.images': 'Reference Images',
    'chat.settings.language': 'Language',
    'chat.settings.orientation': 'Orientation',
    'sidebar.settings.import': 'Import History',
    'sidebar.settings.export_all': 'Export All History',
    'sidebar.export_session': 'Export Session',
    'sidebar.import.success': 'Successfully imported {count} session(s).',
    'sidebar.import.error': 'Failed to import sessions. Invalid file format.',
  },
  zh: {
    'app.title': 'Sorafy',
    'app.open_menu': '打开菜单',
    'sidebar.new_creation': '新的创作',
    'sidebar.history': '历史记录',
    'sidebar.collapse_sidebar': '收起侧边栏',
    'sidebar.settings.language': '语言',
    'sidebar.settings.theme': '主题',
    'sidebar.settings.debug_mode': '调试模式',
    'sidebar.autorename': '自动重命名',
    'sidebar.autorenaming': '重命名中...',
    'initial.title': '创建一个新的 sora-2 提示词',
    'initial.prompt_language.label': '提示词语言',
    'initial.prompt_language.en': '英语',
    'initial.prompt_language.zh': '中文',
    'initial.prompt_language.ja': '日语',
    'initial.prompt_language.ko': '韩语',
    'initial.orientation.label': '视频方向',
    'initial.orientation.portrait': '竖屏 9:16',
    'initial.orientation.landscape': '横屏 16:9',
    'initial.duration.label': '视频时长 (秒)',
    'initial.images.label': '参考图 (可选)',
    'initial.images.cta': '点击上传或拖放文件',
    'initial.images.analyze_button': '分析图像并建议 Idea',
    'initial.images.analyzing_button': '分析中...',
    'initial.idea.label': '视频 Idea',
    'initial.idea.placeholder': '在这里描述您的视频概念...',
    'initial.generate_button': '生成',
    'initial.generate_button.hint': '或按 Ctrl+Enter',
    'initial.error.idea_required': '视频 Idea 是必需的。',
    'initial.github.star': '如果喜欢点个Star',
    'chat.cancel_button': '取消',
    'chat.copied_message': '已复制!',
    'chat.copy_button': '复制提示词',
    'chat.delete_button': '删除',
    'chat.edit_button': '重命名',
    'chat.input.placeholder': '提供反馈以优化提示词...',
    'chat.initial_settings_title': '初始提示词设定',
    'chat.regenerate_button': '重新生成',
    'chat.save_button': '保存',
    'chat.send_button': '发送',
    'chat.settings.duration': '时长',
    'chat.settings.idea': '想法',
    'chat.settings.images': '参考图',
    'chat.settings.language': '语言',
    'chat.settings.orientation': '方向',
    'sidebar.settings.import': '导入历史记录',
    'sidebar.settings.export_all': '导出全部历史',
    'sidebar.export_session': '导出会话',
    'sidebar.import.success': '成功导入 {count} 个会话。',
    'sidebar.import.error': '导入会话失败。文件格式无效。',
  },
};