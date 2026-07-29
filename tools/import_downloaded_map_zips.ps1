param(
    [Parameter(Mandatory = $false)]
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing

$zipDir = Join-Path $ProjectRoot '全国省份手绘地图ZIP'
$collection = Join-Path $ProjectRoot '全国省份手绘地图'
$tmpRoot = Join-Path $ProjectRoot 'tmp'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$stage = Join-Path $tmpRoot "zip-import-staging-$stamp"
$backup = Join-Path $tmpRoot "zip-import-backup-$stamp"
$downloadArchive = Join-Path 'C:\Users\chenlj34\Downloads\全国省份手绘地图ZIP' "已导入项目_$stamp"

$archiveMap = [ordered]@{
    '澳门特别行政区手绘地图合集.zip' = '澳门特别行政区'
    '北京市及16区手绘地图合集.zip' = '北京市'
    '甘肃省及14市州手绘地图合集.zip' = '甘肃省'
    '广东省及21市手绘地图合集.zip' = '广东省'
    '贵州省及9市州手绘地图合集.zip' = '贵州省'
    '河北省手绘地图合集.zip' = '河北省'
    '湖北省手绘地图合集.zip' = '湖北省'
    '内蒙古自治区手绘地图合集.zip' = '内蒙古自治区'
    '宁夏回族自治区及5市手绘地图合集.zip' = '宁夏回族自治区'
    '青海省手绘地图合集.zip' = '青海省'
    '四川省及21市州与九寨沟手绘地图合集.zip' = '四川省'
    '台湾省手绘地图合集.zip' = '台湾省'
    '天津市及16区手绘地图合集.zip' = '天津市'
    '香港特别行政区手绘地图合集.zip' = '香港特别行政区'
    '新疆维吾尔自治区手绘地图合集.zip' = '新疆维吾尔自治区'
}

if (-not (Test-Path -LiteralPath $zipDir)) {
    throw "未找到 ZIP 目录：$zipDir"
}

$resolvedProject = (Resolve-Path -LiteralPath $ProjectRoot).Path
$resolvedZip = (Resolve-Path -LiteralPath $zipDir).Path
if (-not $resolvedZip.StartsWith($resolvedProject, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'ZIP 目录不在项目范围内'
}

foreach ($zipName in $archiveMap.Keys) {
    $zipPath = Join-Path $zipDir $zipName
    if (-not (Test-Path -LiteralPath $zipPath)) {
        throw "缺少待导入文件：$zipName"
    }
}

New-Item -ItemType Directory -Path $stage, $backup, $downloadArchive -Force | Out-Null
$summary = @()

foreach ($zipName in $archiveMap.Keys) {
    $province = $archiveMap[$zipName]
    $zipPath = Join-Path $zipDir $zipName
    $provinceStage = Join-Path $stage $province
    New-Item -ItemType Directory -Path $provinceStage -Force | Out-Null

    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $provinceStage)
    $pngFiles = @(
        Get-ChildItem -LiteralPath $provinceStage -Recurse -File |
            Where-Object { $_.Extension -ieq '.png' }
    )

    foreach ($file in $pngFiles) {
        $image = [System.Drawing.Image]::FromFile($file.FullName)
        try {
            if ($image.Width -le 0 -or $image.Height -le 0) {
                throw "图片尺寸无效：$($file.FullName)"
            }
        }
        finally {
            $image.Dispose()
        }
    }

    $target = Join-Path $collection $province
    $targetImages = Join-Path $target 'images'
    $provinceBackup = Join-Path $backup $province
    New-Item -ItemType Directory -Path $target, $provinceBackup -Force | Out-Null

    if (Test-Path -LiteralPath $targetImages) {
        Move-Item -LiteralPath $targetImages -Destination (Join-Path $provinceBackup 'images')
    }
    New-Item -ItemType Directory -Path $targetImages -Force | Out-Null

    foreach ($file in $pngFiles) {
        Move-Item -LiteralPath $file.FullName -Destination (Join-Path $targetImages $file.Name)
    }

    $otherFiles = @(
        Get-ChildItem -LiteralPath $provinceStage -Recurse -File |
            Where-Object { $_.Extension -ine '.png' }
    )

    foreach ($file in $otherFiles) {
        $destinationName = $file.Name
        if ($destinationName -in @('小红书文案.md', '小红书文案与标签.md')) {
            $destinationName = '小红书配文.md'
        }

        $destination = Join-Path $target $destinationName
        if (Test-Path -LiteralPath $destination) {
            $backupFile = Join-Path $provinceBackup $destinationName
            if (Test-Path -LiteralPath $backupFile) {
                $backupFile = Join-Path $provinceBackup ("旧版_$destinationName")
            }
            Move-Item -LiteralPath $destination -Destination $backupFile
        }
        Move-Item -LiteralPath $file.FullName -Destination $destination
    }

    $summary += [PSCustomObject]@{
        Province = $province
        PNGs = $pngFiles.Count
        Documents = $otherFiles.Count
    }
}

$zipFiles = @(Get-ChildItem -LiteralPath $zipDir -File -Filter '*.zip')
foreach ($zipFile in $zipFiles) {
    $destination = Join-Path $downloadArchive $zipFile.Name
    if (Test-Path -LiteralPath $destination) {
        throw "下载归档目标已存在：$destination"
    }
    Move-Item -LiteralPath $zipFile.FullName -Destination $destination
}

$resolvedStage = (Resolve-Path -LiteralPath $stage).Path
$resolvedTmp = (Resolve-Path -LiteralPath $tmpRoot).Path
if (-not $resolvedStage.StartsWith($resolvedTmp, [StringComparison]::OrdinalIgnoreCase)) {
    throw '暂存目录校验失败'
}
Remove-Item -LiteralPath $stage -Recurse -Force

if (@(Get-ChildItem -LiteralPath $zipDir -Force).Count -eq 0) {
    Remove-Item -LiteralPath $zipDir -Force
}

$summary | Format-Table -AutoSize
Write-Output "BACKUP=$backup"
Write-Output "ZIP_ARCHIVE=$downloadArchive"
