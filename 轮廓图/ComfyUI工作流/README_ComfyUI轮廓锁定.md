# ComfyUI 轮廓锁定草原地图工作流

本目录配合上级目录里的三个文件使用：

- `comfyui_左图轮廓_mask.png`：白色区域允许生成，黑色区域禁止生成。轮廓一致靠它保证。
- `comfyui_左图轮廓_control.png`：黑线轮廓，可给 ControlNet Lineart/Canny 锁边。
- `07_ComfyUI前置_左图轮廓锁定预览.png`：本地 mask 裁切预览，证明轮廓可以被硬裁死。

## 推荐 ComfyUI 节点思路

1. Load Image：载入 `comfyui_左图轮廓_mask.png`。
2. Load Image：载入 `comfyui_左图轮廓_control.png`。
3. Empty Latent Image：尺寸建议与 mask 一致或等比缩放，例如 832x1536 / 1024x1792。
4. Checkpoint Loader：使用 SDXL / JuggernautXL / RealVisXL / DreamShaperXL 等模型。
5. ControlNet Loader：Lineart 或 Canny。
6. Apply ControlNet：把 control 图接进去，strength 0.75-1.0。
7. VAE Encode for Inpaint 或 Set Latent Noise Mask：把 mask 接成生成限制区域。
8. KSampler：steps 30-40，CFG 5-7，denoise 0.75-1.0。
9. VAE Decode。
10. ImageCompositeMasked：最终再用 mask 把外部裁成白底或透明底，保证轮廓 100% 一致。

## 正向提示词

Top-down orthographic raised terrain map cutout, exact silhouette locked by mask, lush green grassland, rolling meadow relief, winding blue rivers, small ponds, scattered tiny tree clusters, pale stone and earth beveled rim, visible physical thickness around the entire edge, soft ambient occlusion, clean white background, soft cast shadow, polished miniature diorama terrain, high detail, realistic grass texture, no text, no labels, no icons.

## 负向提示词

text, Chinese text, labels, icons, orange callouts, buildings, cars, trains, railways, roads, compass, watermark, logo, city markers, UI, sky background, clouds, horizon, strong isometric perspective, tilted camera, distorted silhouette, extra protrusions, cropped map, flat vector, low quality, blurry.

## 保证轮廓一致的关键

ComfyUI 生成完以后，必须再做一次 `ImageCompositeMasked` 或外部 PS/Python 蒙版裁切。AI 负责生成内部纹理，最终轮廓由 mask 决定，不由 AI 决定。
