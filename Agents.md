# 省份手绘地理图生成 Agent 流程

本文档用于复用本次“内蒙古手绘地图海报”流程，后续生成其他省份时按此执行。

## 目标

根据参考图风格，为一个省级行政区生成一套复古立体手绘地理图：

- 省级总览图 1 张
- 地级市 / 自治州 / 盟等主要行政区分图
- 必要时补充强旅游认知城市或区域
- 图片只保存到各自省份目录或合集子文件夹，不要平铺到当前文件夹根目录
- ZIP 压缩包方便转发
- 可选生成小红书配文，配文末尾必须带小红书话题标签
- 如果用户要求“Telegram 发我”，默认发送所有 PNG 图片原图和小红书文案正文；ZIP 只作为本地归档或用户明确要求压缩包时发送

## 参考风格

本次参考图风格要点：

- 复古羊皮纸背景
- 细线中式装饰边框
- 大号中文书法标题
- 等距 / 鸟瞰式立体地图
- 手绘钢笔线稿 + 水彩上色
- 地形、河流、城市、建筑、交通、动植物同时出现
- 小立牌标注地名和景点
- 底部 5-6 个小景窗展示代表性地貌或地标，每个小景窗必须带 1 句简短中文介绍，说明该图案代表什么地理、文化或城市特征
- 整体像旧地图、文旅海报、地理图鉴

生成时应避免：

- 现代扁平矢量风
- 真实照片质感
- 过度 3D 渲染
- 大量随机乱码文字
- 水印

## 前期准备

1. 明确省份名称，例如：`内蒙古自治区`、`黑龙江省`、`四川省`。
2. 明确输出目录，默认使用当前工作目录。
3. 如果用户提供参考图，先读取并观察风格。
4. 确定该省份的行政区列表。
5. 查询或整理各地级行政区最新可获得的常住人口数据。
6. 将地级行政区按常住人口数量从多到少排序，作为分图生成和编号顺序。
7. 确定是否需要补充非地级但认知强的城市或区域。
8. 生成每个城市 / 地区分图前，必须先搜索并查看该城市地图或官方文旅地图，整理真实空间关系：主要河流湖泊、山脉海岸、老城 / 新城、交通走廊、地标相对方位。后续绘图必须以地图关系为骨架，再叠加景点与文化元素，不能只按景点清单自由拼贴。

例如内蒙古：

- 省级总览：内蒙古自治区
- 12 个盟市：呼和浩特、包头、乌海、赤峰、通辽、鄂尔多斯、呼伦贝尔、巴彦淖尔、乌兰察布、兴安盟、锡林郭勒盟、阿拉善盟
- 补充城市：海拉尔、满洲里

## 推荐目录结构

不要把 PNG 图片平铺到当前文件夹根目录。每个省份应使用独立目录保存图片，ZIP 可以放在当前目录或省份目录中。

以省份英文或拼音命名合集目录：

```text
当前目录/
  province_handdrawn/
    00_省份总览.png
    01_城市A.png
    02_城市B.png
    ...
  province_handdrawn.zip
```

中文省份也可使用中文目录，例如：

```text
当前目录/
  内蒙古.zip
  内蒙古/
    00_内蒙古自治区总览.png
    01_呼和浩特市.png
    ...
```

## 生成顺序

建议按以下顺序执行：

1. 先生成省级总览图。
2. 每生成一个地级行政区分图前，先搜索该城市地图，确认核心地理骨架和主要地标方位。
3. 再生成所有地级行政区分图，顺序按最新可获得常住人口数量从多到少排列。
4. 最后补充强旅游认知城市或特殊区域；补充区域同样要先查地图，再按真实空间关系生成。
5. 复制到该省份专属目录或合集子文件夹。
6. 更新 ZIP 压缩包。
7. 生成小红书配文，并在末尾补充小红书话题标签。

这样不容易漏掉“省份总览图”，也能让整套图片顺序更符合城市规模认知。

## 省级总览图 Prompt 模板

将 `{省份}`、`{副标题}`、`{地貌}`、`{行政区列表}`、`{底部景窗}` 替换成目标省份内容。

```text
Use case: stylized-concept
Asset type: illustrated regional travel-map poster
Primary request: Create one hand-drawn vintage illustrated overview map poster for {省份}, matching the reference style: antique parchment background, ornate Chinese border, large brush calligraphy title, raised cutout regional map silhouette, isometric hand-painted terrain, dense ink-and-watercolor details, sepia outlines, muted natural colors.
Subject: {省份} overall map. Large Chinese calligraphy title at top: “{省份}”. Subtitle: “{副标题}”.
Scene/backdrop: Show the full province shape as a raised illustrated map cutout. Include representative geography: {地貌}. Include cities, rivers, lakes, mountains, plains, forests, farmland, historic sites, railways and local cultural symbols.
Key regional labels with small plaques: {行政区列表}.
Bottom inset panels with captions and one-sentence Chinese descriptions: {底部景窗}. Each bottom inset must include a distinctive local pattern, landmark, landform, animal, plant, craft, food, or cultural symbol, plus a short explanation of what it represents. Do not only draw the icons without explanatory text.
Composition: portrait poster, title area on top, central full-region map silhouette spanning most of the page, small callout plaques connected by thin lines, decorative compass rose, ornate corner motifs, bottom row of six framed scenic vignettes. Under or inside each bottom vignette, add a short Chinese caption plus a one-sentence description.
Text handling: Chinese text should be short, legible, brush-style, and limited to the specified title, subtitle, regional labels, and inset captions. Avoid random invented text.
Style constraints: hand-drawn vintage atlas illustration, detailed watercolor and ink linework, parchment texture, museum travel poster feel, no photorealism, no flat vector, no modern UI, no watermark.
```

## 城市 / 地区分图 Prompt 模板

```text
Use case: stylized-concept
Asset type: illustrated travel-map poster series
Primary request: Create one hand-drawn vintage travel map poster for {城市或地区}, matching the existing series style: antique parchment background, ornate Chinese border, large brush calligraphy title, dense isometric bird's-eye travel map, ink-and-watercolor, sepia linework, muted natural colors.
Subject: {城市或地区}, {省份}. Large Chinese title at top: “{城市或地区}”. Subtitle: “{副标题}”.
Map basis: Before drawing, use the real city map as the spatial skeleton. Show the correct relative positions of major rivers, lakes, mountains, coastline, old city, new district, transport corridors, and key landmarks. Preserve important map relationships from the searched map; do not freely scatter landmarks.
Scene/backdrop: {城市或地区的核心地理与城市气质}. Include representative terrain, rivers, city blocks, railways, landmarks, cultural architecture, local agriculture or ecology.
Key landmarks with labels: {地标1}, {地标2}, {地标3}, {地标4}, {地标5}, {地标6}.
Composition: portrait poster; title at top; central panoramic bird's-eye illustrated city map; vertical callout plaques connected by thin lines; decorative compass rose; ornate corner motifs; bottom row of six framed scenic vignette panels with captions and one-sentence Chinese descriptions. Each bottom vignette should explain the distinctive local pattern, landmark, landform, animal, plant, craft, food, or cultural symbol it shows.
Text handling: Chinese text should be short and legible; use only the specified title, subtitle, labels and captions; avoid random invented text.
Style constraints: hand-drawn vintage atlas illustration, fine ink linework, watercolor washes, weathered parchment texture, no photorealism, no flat vector, no modern UI, no watermark.
```

## 命名规则

推荐使用两位数字排序。`00` 固定为省级总览图；`01` 开始按地级行政区最新可获得常住人口数量从多到少编号；补充的县级市、城区、旅游区或特殊区域排在所有地级行政区之后。

```text
00_省份总览.png
01_人口最多的地级行政区.png
02_城市A.png
03_城市B.png
...
13_补充城市A.png
14_补充城市B.png
```

内蒙古示例（实际生成前应按最新常住人口数据重新排序）：

```text
00_内蒙古自治区总览.png
01_呼和浩特市.png
02_包头市.png
03_乌海市.png
04_赤峰市.png
05_通辽市.png
06_鄂尔多斯市.png
07_呼伦贝尔市.png
08_巴彦淖尔市.png
09_乌兰察布市.png
10_兴安盟.png
11_锡林郭勒盟.png
12_阿拉善盟.png
13_海拉尔.png
14_满洲里.png
```

## 文件整理命令示例

生成工具会默认把图片保存在 `.codex/generated_images/...` 随机文件名中。需要复制到该省份专属目录并重命名，不要复制到当前文件夹根目录。

```bash
mkdir -p province_handdrawn

cp "生成图路径A.png" "province_handdrawn/00_省份总览.png"
cp "生成图路径B.png" "province_handdrawn/01_省会.png"

zip -q -r province_handdrawn.zip province_handdrawn
```

如果 ZIP 已存在，增量更新：

```bash
zip -q -u province_handdrawn.zip "province_handdrawn/13_补充城市.png"
```

## Telegram 发送规则

当用户要求“Telegram 发我”“发到 Telegram”“tg 发我”时，按以下规则执行：

1. 先确认或获取 bot token 和 chat_id。token 属于敏感信息，后续日志和回复里不要复述完整 token。
2. 如果 bot 还没有和用户建立私聊，让用户先给 bot 发一句话，再用 `getUpdates` 获取 chat_id。
3. 默认逐张发送省份目录里的 PNG 图片，而不是只发送 ZIP。每张图片 caption 使用文件名去掉 `.png` 后的名称，例如 `00_甘肃省总览`。
4. 图片全部发送完成后，再单独发送小红书配文正文。不要只把配文放进 ZIP。
5. Telegram 默认不发送 ZIP；ZIP 只在本地归档，或用户明确要求“发送压缩包 / 发 ZIP”时才通过 Telegram 发送。
6. 用户说“Telegram 发送”“Telegram 发我”“tg 发我”但没有明确提 ZIP 时，只发送 PNG 原图和小红书文案正文，不要附带压缩包。
7. 如果用户明确要求发送 ZIP，注意 Telegram Bot API 上传大小限制；超限时再拆分 ZIP，但拆分 ZIP 不能替代图片和文案正文的默认发送。

示例：

```bash
TG_TOKEN="你的 bot token"
CHAT_ID="你的 chat_id"

for f in province_handdrawn/*.png; do
  base=$(basename "$f" .png)
  curl -s -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendPhoto" \
    -F chat_id="$CHAT_ID" \
    -F photo=@"$f" \
    -F caption="$base"
done

curl -s -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
  -d chat_id="$CHAT_ID" \
  --data-urlencode text@province_xiaohongshu.txt
```

## 质量检查清单

每张图生成后检查：

- 是否符合羊皮纸复古地图风格
- 标题是否为目标省份 / 城市
- 是否有明显跑题地貌
- 城市 / 地区分图是否先查过地图，并按真实河流、湖泊、山脉、海岸、老城、新城、交通和地标相对方位组织画面
- 是否保留边框、指南针、底部景窗
- 底部 5-6 个特有图案 / 景窗是否都有简短中文介绍，不能只有图案或标题
- 地标是否基本合理
- 画面是否无水印
- 中文小字是否可接受

注意：AI 图像模型生成中文小标签时，可能出现笔画不准或局部乱码。需要对外发布时，建议后续做一轮文字修正版，或在 PS / 画图工具中手动覆盖关键文字。

## 小红书配文模板

配文末尾必须添加话题标签。话题建议 8-12 个，包含：

- 省份名 / 省份短名，例如 `#内蒙古`、`#河北`
- 手绘地图主题，例如 `#手绘地图`、`#地图插画`、`#地理图鉴`
- 文旅与旅行主题，例如 `#旅行地图`、`#城市旅行`、`#文旅海报`
- 地理认知主题，例如 `#中国地理`、`#省份地图`、`#人文地理`
- 该省代表性地貌或文化关键词，例如 `#草原`、`#太行山`、`#长城`、`#黄河`

话题单独成段，放在正文最后，不要夹在段落中间。

```text
把{省份}画成一张立体手绘地图，才发现它的地理性格特别{关键词}。

{地貌段落1}

{城市与地标段落}

{省份}的美，不只是“{常见印象}”，而是{地理元素1}、{地理元素2}、{地理元素3}、{地理元素4}共同塑造了这片土地。

一半是{意象A}。
一半是{意象B}。

如果每个省都做成这样的手绘地理图，你最想先看哪个省？

{省份短名}：{八到十二字总结语}。

# {省份短名} #手绘地图 #地图插画 #地理图鉴 #中国地理 #省份地图 #旅行地图 #文旅海报 #{代表性地貌1} #{代表性地貌2}
```

内蒙古示例：

```text
把内蒙古画成一张立体手绘地图，才发现它的地理性格特别辽阔。

大兴安岭撑起东部林海，呼伦贝尔草原铺开无边绿意，锡林郭勒草原延展成风吹草低的北疆长卷。往西走，阴山与河套平原相依，黄河在鄂尔多斯绕出壮阔弯道，阿拉善的戈壁、沙漠与胡杨林又把画面推向苍茫深处。

呼和浩特有青城古韵，包头有草原钢城的筋骨，呼伦贝尔有草原、湿地与边城，满洲里有国门和异域风情，海拉尔是通向草原深处的门户。额济纳的胡杨、响沙湾的沙海、阿尔山的森林与火山，也都藏着内蒙古不同的地理表情。

内蒙古的美，不只是“草原很大”，而是森林、草原、沙漠、黄河、边境、湖泊共同塑造了这片土地。

一半是草原长风。
一半是大漠星河。

如果每个省都做成这样的手绘地理图，你最想先看哪个省？

内蒙古：草原长卷，北疆万里。

#内蒙古 #手绘地图 #地图插画 #地理图鉴 #中国地理 #省份地图 #旅行地图 #文旅海报 #草原 #大兴安岭 #黄河 #北疆
```

## 易漏点

- 不要只生成地级市，必须先生成省级总览图。
- 县级市或区如果旅行认知很强，需要额外补图。
- 行政区和旅游区不是一回事，需要分别判断。
- 生成后要复制到各自省份目录或合集目录，不能只留在 `.codex/generated_images`。
- 不要把 PNG 图片平铺到当前文件夹根目录；根目录只保留说明文件、ZIP、必要文案等非图片交付物。
- ZIP 要在补图后同步更新。
- 发布文案要突出地理性格，不要只罗列景点。
- 小红书配文末尾必须带话题标签，优先覆盖省份、手绘地图、地理、文旅和代表性地貌关键词。
