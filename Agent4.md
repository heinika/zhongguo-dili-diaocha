# Telegram 发图 Agent

## 目标

在地图图片生成完成后，将最终 PNG 图片保存到项目目录，并通过 Telegram Bot 发送给用户。

## 当前项目脚本

本项目使用以下脚本发送图片：

```powershell
C:\Users\vip10\Documents\地理\tools\send-telegram-image.ps1
```

脚本参数：

- `-ImagePath`：必填，图片完整路径。
- `-Caption`：可选，Telegram 图片说明。
- `-BotToken`：可选，默认读取环境变量 `TELEGRAM_BOT_TOKEN`。
- `-ChatId`：可选，默认读取环境变量 `TELEGRAM_CHAT_ID`。

## 环境变量

Telegram 发送功能依赖两个用户环境变量：

```powershell
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

不要把真实 bot token 写入 `Agent4.md`、`Agents.md`、提示词文件、README 或任何会提交/分享的项目文件。

如果当前 PowerShell 进程读不到环境变量，可以从 Windows 用户环境变量显式读取：

```powershell
$token = [Environment]::GetEnvironmentVariable('TELEGRAM_BOT_TOKEN', 'User')
$chatId = [Environment]::GetEnvironmentVariable('TELEGRAM_CHAT_ID', 'User')
```

## 发送图片标准流程

1. 生成图片后，先把最终版本复制到项目图片目录，不要只留在 `.codex/generated_images`。
2. 使用规范文件名保存，例如：

```text
C:\Users\vip10\Documents\地理\全国省份手绘地图\北京市\images\04-朝阳区-v5.png
```

3. 发送前检查图片存在、文件大小正常、尺寸为竖版 2:3，推荐 `1024 x 1536`。
4. 调用发送脚本：

```powershell
$script = 'C:\Users\vip10\Documents\地理\tools\send-telegram-image.ps1'
$token = [Environment]::GetEnvironmentVariable('TELEGRAM_BOT_TOKEN', 'User')
$chatId = [Environment]::GetEnvironmentVariable('TELEGRAM_CHAT_ID', 'User')

& $script `
  -ImagePath 'C:\Users\vip10\Documents\地理\全国省份手绘地图\北京市\images\04-朝阳区-v5.png' `
  -Caption '04-朝阳区-v5' `
  -BotToken $token `
  -ChatId $chatId
```

5. 只有脚本返回 `Sent: 图片路径` 后，才能告诉用户“已发送到 Telegram”。

## 批量发送

批量发送时按文件编号顺序发送，并在每张之间暂停 1 秒，避免请求过快：

```powershell
$script = 'C:\Users\vip10\Documents\地理\tools\send-telegram-image.ps1'
$token = [Environment]::GetEnvironmentVariable('TELEGRAM_BOT_TOKEN', 'User')
$chatId = [Environment]::GetEnvironmentVariable('TELEGRAM_CHAT_ID', 'User')

$files = @(
  'C:\Users\vip10\Documents\地理\全国省份手绘地图\北京市\images\01-北京市总图-v2.png',
  'C:\Users\vip10\Documents\地理\全国省份手绘地图\北京市\images\02-东城区.png'
)

foreach ($file in $files) {
  $caption = [IO.Path]::GetFileNameWithoutExtension($file)
  & $script -ImagePath $file -Caption $caption -BotToken $token -ChatId $chatId
  Start-Sleep -Seconds 1
}
```

## 获取 chat_id

如果需要重新配置 `TELEGRAM_CHAT_ID`：

1. 用户先打开自己的 Telegram bot。
2. 给 bot 发送 `/start` 或 `hi`。
3. 调用 Telegram Bot API 的 `getUpdates`。
4. 在返回 JSON 中查找：

```json
"chat":{"id":123456789}
```

其中 `id` 就是 `TELEGRAM_CHAT_ID`。

## 安全规则

- bot token 等同于 bot 密钥，不能公开展示。
- 如果 token 曾经出现在截图、聊天或文档中，建议让用户到 BotFather 执行 `/revoke` 重新生成 token。
- 新 token 只应写入 Windows 用户环境变量，不应写入项目文件。
- 发送失败时不要在最终回复中打印完整 token。

## 常见故障

- `Missing TELEGRAM_BOT_TOKEN`：当前进程没有读到环境变量，改用 `[Environment]::GetEnvironmentVariable(..., 'User')` 后通过 `-BotToken` 显式传入。
- `Missing TELEGRAM_CHAT_ID`：同上，读取用户环境变量后通过 `-ChatId` 显式传入。
- `Telegram send failed`：检查 bot token 是否被撤销、chat_id 是否正确、用户是否已经给 bot 发过消息。
- 图片路径含中文时必须使用完整绝对路径，并用单引号包住路径。

## 完成反馈

发送成功后，最终回复应包含：

- 已发送到 Telegram。
- 保存后的本地图片路径。
- 如为批量发送，说明发送数量和文件名。
