# ComfyUI 轮廓锁定与图标合成流程

本文记录“轮廓百分百一致，内部用 AI 生成，图标按参考图对应位置摆放”的工作流。

## 核心原则

1. 轮廓不能交给 AI 猜，必须由黑白 mask 锁死。
2. ComfyUI 只负责在 mask 内生成地图底板、草地、河流、道路等基础内容。
3. 图标位置不让 AI 自由摆放，按参考图上的标签/点位坐标后期合成。
4. 最终必须再用同一张 mask 裁切一次，保证外轮廓 100% 一致。

## 输入文件

- `outline.png`：黑线轮廓图，只有地图边界。
- `reference_map.png`：原始参考图，提供元素位置、标签位置、道路/河流关系。
- `icon_sheet_1.png`：批量图标素材，例如浮桥、水师营遗址、嫩江春白酒等。
- `icon_sheet_2.png`：补充图标素材，例如鹤克木鲁大道、古驿雄风。
- `terrain_reference.png`：绿色地图底板风格参考，可选。

## 轮廓 mask 制作

1. 将 `outline.png` 转为灰度。
2. 阈值提取黑色轮廓线。
3. 对轮廓线做 `dilate` 和 `morphology close`，补齐细小断点。
4. 找最大外轮廓 `findContours(..., RETR_EXTERNAL)`。
5. 用 `drawContours(..., FILLED)` 填充成实心区域。
6. 输出：
   - `mask.png`：白色为地图内部，黑色为外部。
   - `control.png`：白底黑线轮廓，给 ControlNet Lineart/Canny 使用。

注意：如果从截图直接 flood-fill，断线会造成白洞或碎片。优先用干净轮廓线生成最大闭合轮廓。

## ComfyUI 生成底图

推荐节点顺序：

1. `Load Image`：载入 `mask.png`。
2. `Load Image`：载入 `control.png`。
3. `Checkpoint Loader`：SDXL / RealVisXL / DreamShaperXL / JuggernautXL 均可。
4. `ControlNet Loader`：Lineart 或 Canny。
5. `Apply ControlNet`：控制强度建议 `0.75-1.0`。
6. `VAE Encode for Inpaint` 或 `Set Latent Noise Mask`：只允许 mask 白色区域生成。
7. `KSampler`：
   - steps：`30-40`
   - CFG：`5-7`
   - denoise：`0.75-1.0`
8. `VAE Decode`。
9. `ImageCompositeMasked`：用同一张 `mask.png` 最终裁切。

底图正向提示词：

```text
top-down raised 3D tourism map base, exact silhouette locked by mask,
light yellow-green grass terrain, miniature map surface, subtle meadow texture,
small scattered trees, soft rolling terrain, clean commercial map style,
visible beveled stone/earth rim, soft ambient occlusion, no labels
```

底图负向提示词：

```text
text, Chinese text, labels, orange callouts, buildings, vehicles, people,
icons, watermark, logo, clouds, sky, outside the mask, distorted silhouette,
wrong outline, flat vector, satellite photo, dense forest canopy
```

如果当前阶段只需要绿色底板，负向提示词里继续禁止道路、河流、铁路和建筑；后续再单独生成或手动叠加。

## 图标抠图

图标素材通常是白底排版图。处理方式：

1. 按网格或手工框选裁出单个图标。
2. 不裁入底部橙色大标签，图 3 上已有标签时尤其要避免重复。
3. 用“从边缘 flood-fill 白底”的方式去背景：
   - 候选背景：高亮、低饱和白色/浅灰色。
   - 只移除与裁图边缘连通的白色区域。
   - 保留图标内部白色高光、杯子、墙面等非连通白色。
4. 输出透明 PNG 图标。

## 图标位置规则

图标坐标以 `reference_map.png` 的原始像素坐标为准。先按参考图已有标签/点位定位，再把图标缩小到轮廓内。不要让 AI 自己决定图标位置。

本次图 3 的参考点位如下，格式为：

```text
名称, x, y, 最大宽度
```

```csv
浮桥,372,642,48
水师营遗址,490,560,43
嫩江春白酒,538,594,46
嫩江大酒店,430,681,42
北鹅产业园,585,607,38
农机产业园,610,675,42
中国大豆城,687,684,45
王带金珠,421,700,36
博物馆,388,728,36
墨尔根老街,468,734,38
商业区,438,758,35
驿站公园,370,755,36
黑龙江嫩江驿站遗址,410,775,34
创意里,496,792,36
客运站,498,817,34
东方汇酒店,504,842,34
立交桥,614,692,42
嫩江站,545,758,43
冰花啤酒,620,777,34
中小企业孵化园,615,817,36
鹤克木鲁大道,225,884,48
古驿雄风,545,960,54
```

如果更换参考图，重新量坐标即可，坐标表结构不变。

## 现代 3D 立体 UI 版本

如果目标不是保留原平面地图，而是生成“现代 3D 立体 UI 风格”，底图应单独重建，不要直接在原始平面图上贴图标。

推荐做法：

1. 用 `mask.png` 生成一块浅黄绿色地图底板。
2. 给底板增加侧壁厚度：
   - 将 mask 多次向右下偏移，叠加米黄色/土黄色半透明层。
   - 用高斯模糊阴影制造浮起效果。
   - 外沿叠加浅色描边和深色细描边，形成 bevel rim。
3. 只保留底板、轻微草纹、稀疏小树和柔和投影。
4. 不把旧平面图里的道路、文字、河流直接带入底板，除非后续明确需要。

这样得到的是一个干净的现代 3D UI 地图底座，再把图标作为独立 UI 元素贴上去。

## 图标避让规则

参考图点位通常很密，直接按坐标贴会遮挡。合成时需要做简单碰撞避让：

1. 每个图标先按最大宽度缩放。
2. 以参考坐标为中心，生成候选点：
   - 原点
   - 上、下、左、右
   - 四个斜角方向
   - 半径依次尝试 `14, 24, 36, 50, 64` 像素
3. 对每个候选点计算两个条件：
   - 图标矩形大部分是否仍在 mask 内。
   - 是否与已放置图标矩形相交。
4. 选择距离原坐标最近且不重叠的位置。
5. 如果无解，图标再缩小一次，例如缩到 `82%`。
6. 图标之间保留 `6px` 以上间距。

视觉优先级：

- 首先保证图标不出轮廓。
- 其次保证图标之间不遮挡。
- 再其次才是完全贴合参考坐标。
- 大型图标如 `古驿雄风`、`鹤克木鲁大道` 允许更明显地缩小。

## 最终合成顺序

1. 用 ComfyUI 生成 `base_map.png`。
2. 用 `mask.png` 裁切 `base_map.png`，得到锁死轮廓的底图。
3. 按坐标表把透明 PNG 图标贴入底图。
4. 图标过大时先等比缩小，保证图标主体在轮廓内。
5. 如果图标压住标签，优先移动图标，不移动参考标签。
6. 最后再次使用 `mask.png` 裁切地图主体。
7. 输出：
   - 白底 PNG：便于预览和发图。
   - 透明底 PNG：便于后续合成到 3D、海报或视频里。

## 质量检查

- 外轮廓是否来自同一张 mask。
- ComfyUI 输出是否经过最终 `ImageCompositeMasked`。
- 图标是否全部在轮廓内。
- 图标位置是否与参考图标签/点位对应。
- 图标是否没有白底方块。
- 是否没有重复的大橙色标签。
- 是否没有把外部书法、云、无关区域裁进地图主体。
