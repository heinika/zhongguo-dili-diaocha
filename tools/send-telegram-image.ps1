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

$curlArgs = @(
  "-s",
  "-X", "POST",
  $uri,
  "-F", "chat_id=$ChatId",
  "-F", "photo=@$resolvedImagePath"
)

if ($Caption) {
  $curlArgs += @("-F", "caption=$Caption")
}

$rawResponse = & curl.exe @curlArgs
$response = $rawResponse | ConvertFrom-Json

if (-not $response.ok) {
  throw "Telegram send failed: $rawResponse"
}

"Sent: $resolvedImagePath"
