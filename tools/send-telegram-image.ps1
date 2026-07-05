param(
  [Parameter(Mandatory = $true)]
  [string]$ImagePath,

  [string]$Caption = "",

  [string]$BotToken = $env:TELEGRAM_BOT_TOKEN,

  [string]$ChatId = $env:TELEGRAM_CHAT_ID
)

$ErrorActionPreference = "Stop"

if (-not $BotToken) {
  throw "Missing TELEGRAM_BOT_TOKEN. Set it first or pass -BotToken."
}

if (-not $ChatId) {
  throw "Missing TELEGRAM_CHAT_ID. Set it first or pass -ChatId."
}

$resolvedImagePath = Resolve-Path -LiteralPath $ImagePath
$uri = "https://api.telegram.org/bot$BotToken/sendPhoto"

$form = @{
  chat_id = $ChatId
  photo = Get-Item -LiteralPath $resolvedImagePath
}

if ($Caption) {
  $form.caption = $Caption
}

$response = Invoke-RestMethod -Uri $uri -Method Post -Form $form

if (-not $response.ok) {
  throw "Telegram send failed: $($response | ConvertTo-Json -Depth 5)"
}

"Sent: $resolvedImagePath"
