#!/usr/bin/env python3
"""Build the categorized README gallery and lightweight thumbnails."""

from __future__ import annotations

import html
import subprocess
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
THUMBNAIL_ROOT = ROOT / "docs" / "thumbnails"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
THUMBNAIL_SIZE = (240, 360)

COLLECTION_ORDER = {
    "全国省份手绘地图": 0,
    "早期成套系列": 1,
    "历史备份": 2,
    "其他生成图片": 3,
}

PROVINCE_ORDER = [
    "北京市",
    "天津市",
    "河北省",
    "河北",
    "山西省",
    "内蒙古自治区",
    "内蒙古",
    "辽宁省",
    "吉林省",
    "黑龙江省",
    "上海市",
    "江苏省",
    "浙江省",
    "安徽省",
    "福建省",
    "江西省",
    "山东省",
    "河南省",
    "河南",
    "湖北省",
    "湖南省",
    "广东省",
    "广西壮族自治区",
    "海南省",
    "重庆市",
    "四川省",
    "贵州省",
    "云南省",
    "西藏自治区",
    "陕西省",
    "甘肃省",
    "青海省",
    "宁夏回族自治区",
    "新疆维吾尔自治区",
    "香港特别行政区",
    "澳门特别行政区",
    "台湾省",
]
PROVINCE_RANK = {name: index for index, name in enumerate(PROVINCE_ORDER)}


def tracked_images() -> list[Path]:
    try:
        output = subprocess.check_output(
            ["git", "ls-files", "-z"],
            cwd=ROOT,
            stderr=subprocess.DEVNULL,
        ).decode("utf-8")
        candidates = (Path(item) for item in output.split("\0") if item)
    except (OSError, subprocess.CalledProcessError):
        # Windows Python cannot resolve a WSL-format worktree gitdir. A clean
        # worktree contains the same source files, so filesystem discovery is
        # a reliable fallback for local regeneration.
        candidates = (
            path.relative_to(ROOT)
            for path in ROOT.rglob("*")
            if path.is_file()
        )

    paths = []
    for path in candidates:
        if path.parts[:2] == ("docs", "thumbnails"):
            continue
        if path.suffix.lower() in IMAGE_EXTENSIONS:
            paths.append(path)
    return sorted(paths, key=lambda path: path.as_posix())


def thumbnail_path(source: Path) -> Path:
    return Path("docs") / "thumbnails" / source.with_suffix(".webp")


def make_thumbnail(source: Path) -> tuple[Path, str | None]:
    target = thumbnail_path(source)
    absolute_source = ROOT / source
    absolute_target = ROOT / target
    absolute_target.parent.mkdir(parents=True, exist_ok=True)
    try:
        with Image.open(absolute_source) as opened:
            image = ImageOps.exif_transpose(opened)
            image.seek(0)
            image.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            if image.mode in {"RGBA", "LA"} or (
                image.mode == "P" and "transparency" in image.info
            ):
                rgba = image.convert("RGBA")
                flattened = Image.new("RGB", rgba.size, "white")
                flattened.paste(rgba, mask=rgba.getchannel("A"))
                image = flattened
            else:
                image = image.convert("RGB")
            image.save(absolute_target, "WEBP", quality=78, method=6)
    except Exception as exc:  # pragma: no cover - command-line reporting
        return source, str(exc)
    return source, None


def classify(path: Path) -> tuple[str, str, str]:
    parts = path.parts
    if parts[0] == "provinces" and len(parts) >= 3:
        return "早期成套系列", parts[1], "成套图集"

    if parts[0] == "全国省份手绘地图" and len(parts) >= 3:
        folder = parts[1]
        if folder.startswith("_backup_") and len(parts) >= 4:
            return "历史备份", parts[2], "未按计划顺序备份"
        if folder == "福建手绘地图生成图":
            return "全国省份手绘地图", "福建省", "生成图归档"

        province = folder
        if len(parts) >= 4:
            series_folder = parts[2]
            series_names = {
                "images": "主图集",
                "handdrawn": "手绘成套图集",
            }
            series = series_names.get(series_folder, series_folder)
        else:
            series = "图集"
        return "全国省份手绘地图", province, series

    return "其他生成图片", parts[0], "其他"


def province_sort_key(name: str) -> tuple[int, str]:
    return PROVINCE_RANK.get(name, len(PROVINCE_RANK)), name


def url(path: Path) -> str:
    return quote(path.as_posix(), safe="/")


def image_table(paths: list[Path]) -> list[str]:
    lines = ["<table>"]
    for offset in range(0, len(paths), 4):
        lines.append("  <tr>")
        for source in paths[offset : offset + 4]:
            target = thumbnail_path(source)
            label = html.escape(source.stem)
            original_url = url(source)
            thumbnail_url = url(target)
            original_title = html.escape(source.as_posix(), quote=True)
            lines.extend(
                [
                    '    <td width="25%" align="center">',
                    f'      <a href="{original_url}" title="{original_title}">',
                    (
                        f'        <img src="{thumbnail_url}" width="180" '
                        f'alt="{label}" loading="lazy">'
                    ),
                    f"        <br><sub>{label}</sub>",
                    "      </a>",
                    "    </td>",
                ]
            )
        lines.append("  </tr>")
    lines.append("</table>")
    return lines


def build_readme(images: list[Path]) -> str:
    grouped: dict[str, dict[str, dict[str, list[Path]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )
    for image in images:
        collection, province, series = classify(image)
        grouped[collection][province][series].append(image)

    lines = [
        "# 中国地理调查",
        "",
        "中国地理调查：省份手绘地理图与文旅地图资料项目。",
        "",
        "## 图片总览",
        "",
        (
            f"当前 README 共展示 **{len(images)} 张已生成图片**。"
            "所有画面均使用轻量缩略图，点击后可打开仓库中的 PNG、JPEG、"
            "WebP 或 GIF 原图。"
        ),
        "",
        "> 本画廊由 `tools/build_readme_gallery.py` 根据 Git 已跟踪图片自动生成；"
        "新增图片后重新运行脚本即可更新分类和缩略图。",
        "",
        "## 分类导航",
        "",
        "| 分类 | 省份或系列数 | 图片数 |",
        "| --- | ---: | ---: |",
    ]

    for collection in sorted(
        grouped,
        key=lambda item: (COLLECTION_ORDER.get(item, 99), item),
    ):
        province_groups = grouped[collection]
        count = sum(
            len(paths)
            for series in province_groups.values()
            for paths in series.values()
        )
        lines.append(f"| [{collection}](#{quote(collection)}) | {len(province_groups)} | {count} |")

    lines.extend(
        [
            "",
            "## 项目内容",
            "",
            "| 目录 | 内容 |",
            "| --- | --- |",
            "| `全国省份手绘地图/` | 各省级行政区总览图、地级行政区分图与归档系列 |",
            "| `provinces/` | 内蒙古、河北、河南等早期成套手绘地图 |",
            "| `copywriting/` | 小红书发布配文 |",
            "| `docs/` | 生成流程、说明文档与 README 缩略图 |",
            "",
        ]
    )

    for collection in sorted(
        grouped,
        key=lambda item: (COLLECTION_ORDER.get(item, 99), item),
    ):
        lines.extend([f"## {collection}", ""])
        for province in sorted(grouped[collection], key=province_sort_key):
            series_groups = grouped[collection][province]
            province_count = sum(len(paths) for paths in series_groups.values())
            lines.extend(
                [
                    "<details>",
                    (
                        f"<summary><strong>{html.escape(province)}</strong>"
                        f" · {province_count} 张</summary>"
                    ),
                    "",
                ]
            )
            for series in sorted(series_groups):
                series_images = sorted(
                    series_groups[series],
                    key=lambda path: path.as_posix(),
                )
                lines.extend(
                    [
                        (
                            f"<h4>{html.escape(series)}"
                            f" · {len(series_images)} 张</h4>"
                        ),
                        "",
                        *image_table(series_images),
                        "",
                    ]
                )
            lines.extend(["</details>", ""])

    lines.extend(
        [
            "## 说明",
            "",
            "- 缩略图仅用于 README 快速浏览，原图保持原始分辨率和文件格式。",
            "- 版本图、未标注备份和重复归档均按各自路径展示，确保已生成图片不遗漏。",
            "- 部分 ZIP 压缩包使用 Git LFS 管理，不计入图片总数。",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    images = tracked_images()
    if not images:
        raise SystemExit("No tracked images found.")

    with ThreadPoolExecutor(max_workers=6) as executor:
        results = list(executor.map(make_thumbnail, images))
    failures = [(path, error) for path, error in results if error]
    if failures:
        for path, error in failures:
            print(f"FAILED {path}: {error}")
        raise SystemExit(f"{len(failures)} thumbnail(s) failed.")

    expected = {thumbnail_path(source) for source in images}
    if THUMBNAIL_ROOT.exists():
        for existing in THUMBNAIL_ROOT.rglob("*.webp"):
            relative = existing.relative_to(ROOT)
            if relative not in expected:
                existing.unlink()

    (ROOT / "README.md").write_text(build_readme(images), encoding="utf-8")
    print(f"Generated {len(images)} thumbnails and README entries.")


if __name__ == "__main__":
    main()
