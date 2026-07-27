#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const outDir = "outputs/嫩江_陆地轮廓";
const outSvg = path.join(outDir, "nenjiang_3d_icon_collection.svg");

const W = 1320;
const H = 880;
const cellW = 220;
const cellH = 220;

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function iconWrap(i, name, body) {
  const col = i % 6;
  const row = Math.floor(i / 6);
  const x = col * cellW + 32;
  const y = row * cellH + 28;
  return `
  <g class="icon" data-name="${esc(name)}" transform="translate(${x} ${y})">
    <ellipse class="shadow" cx="76" cy="154" rx="62" ry="18"/>
    <path class="base-top" d="M24 128 L76 98 L128 128 L76 158 Z"/>
    <path class="base-left" d="M24 128 L76 158 L76 174 L24 144 Z"/>
    <path class="base-right" d="M128 128 L76 158 L76 174 L128 144 Z"/>
    ${body}
  </g>`;
}

const cube = (x, y, w, h, color = "#f28a2e") => `
  <path d="M${x} ${y} l${w / 2} -${w / 4} l${w / 2} ${w / 4} l-${w / 2} ${w / 4} Z" fill="${color}" filter="url(#soft)"/>
  <path d="M${x} ${y} l${w / 2} ${w / 4} v${h} l-${w / 2} -${w / 4} Z" fill="${shade(color, -22)}"/>
  <path d="M${x + w} ${y} l-${w / 2} ${w / 4} v${h} l${w / 2} -${w / 4} Z" fill="${shade(color, -34)}"/>`;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const icons = [
  ["浮桥", `
    <path d="M32 126 C55 104 94 104 120 126" fill="none" stroke="#62a7d9" stroke-width="22" stroke-linecap="round"/>
    <path d="M42 122 L112 122" stroke="#8b5a2b" stroke-width="10" stroke-linecap="round"/>
    ${[48, 66, 84, 102].map((x) => `<rect x="${x}" y="112" width="10" height="20" rx="3" fill="#f1bd45"/>`).join("")}
  `],
  ["水师营遗址", `
    <path d="M42 110 L76 78 L110 110 Z" fill="#d94a2b"/>
    <rect x="48" y="106" width="56" height="36" rx="5" fill="#b63b2d"/>
    <rect x="66" y="118" width="20" height="24" rx="3" fill="#6b2f24"/>
    <circle cx="54" cy="98" r="5" fill="#ffd067"/><circle cx="98" cy="98" r="5" fill="#ffd067"/>
  `],
  ["嫩江春白酒", `
    <ellipse cx="72" cy="114" rx="28" ry="16" fill="#c9793f"/>
    <path d="M46 114 C46 96 98 96 98 114 L92 144 C88 160 56 160 52 144 Z" fill="#e7b26f"/>
    <rect x="90" y="78" width="18" height="54" rx="7" fill="#f7f0df"/>
    <rect x="94" y="90" width="10" height="24" rx="3" fill="#7fb1d6"/>
    <path d="M36 146 C54 136 96 136 116 146" stroke="#e0b850" stroke-width="8" stroke-linecap="round"/>
  `],
  ["嫩江大酒店", `
    ${cube(42, 92, 70, 58, "#79b7d8")}
    <rect x="56" y="102" width="10" height="10" fill="#ffe9a7"/><rect x="76" y="108" width="10" height="10" fill="#ffe9a7"/>
    <rect x="76" y="132" width="16" height="18" rx="3" fill="#416b82"/>
    <path d="M56 80 L98 68 L116 82 L74 94 Z" fill="#f18442"/>
  `],
  ["玉带金珠", `
    <path d="M35 132 C58 96 96 154 120 110" fill="none" stroke="#4a9bd1" stroke-width="17" stroke-linecap="round"/>
    <circle cx="78" cy="114" r="28" fill="url(#gold)" stroke="#c98716" stroke-width="4"/>
    <circle cx="68" cy="104" r="8" fill="#fff2a8" opacity=".75"/>
  `],
  ["博物馆", `
    <path d="M40 104 L76 78 L112 104 Z" fill="#d56b45"/>
    <rect x="48" y="104" width="56" height="42" rx="5" fill="#f0d5a0"/>
    <rect x="56" y="112" width="8" height="30" fill="#8b5a4b"/><rect x="73" y="112" width="8" height="30" fill="#8b5a4b"/><rect x="90" y="112" width="8" height="30" fill="#8b5a4b"/>
  `],
  ["墨尔根老街", `
    <path d="M42 104 L76 78 L110 104" fill="none" stroke="#2f5c74" stroke-width="10" stroke-linecap="round"/>
    <rect x="48" y="104" width="56" height="34" rx="5" fill="#3b79a0"/>
    <path d="M38 132 L114 132" stroke="#263f4d" stroke-width="8" stroke-linecap="round"/>
    <rect x="58" y="114" width="12" height="18" fill="#ffd67a"/><rect x="83" y="114" width="12" height="18" fill="#ffd67a"/>
  `],
  ["驿站公园", `
    <path d="M38 128 C56 108 92 108 114 128 C92 148 56 148 38 128 Z" fill="#83c67b"/>
    <path d="M52 136 C72 118 82 118 104 136" stroke="#e8c46a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="54" cy="108" r="16" fill="#5aa85f"/><circle cx="100" cy="112" r="14" fill="#67b56a"/>
    <path d="M70 118 L83 106 L96 118" fill="none" stroke="#9b6134" stroke-width="6"/>
  `],
  ["墨尔根副都统衙门遗址", `
    <path d="M38 108 L76 76 L114 108 Z" fill="#c8442e"/>
    <rect x="46" y="108" width="60" height="36" rx="4" fill="#d95734"/>
    <rect x="64" y="120" width="24" height="24" rx="3" fill="#7d3128"/>
    <path d="M34 144 L118 144" stroke="#6c4d35" stroke-width="8" stroke-linecap="round"/>
  `],
  ["商业区", `
    ${cube(38, 102, 76, 40, "#f0a23a")}
    <rect x="48" y="114" width="16" height="20" fill="#74b9d7"/><rect x="70" y="116" width="16" height="18" fill="#f9efd0"/><rect x="92" y="114" width="12" height="20" fill="#74b9d7"/>
    <path d="M38 102 L114 102" stroke="#d94b3d" stroke-width="7" stroke-linecap="round"/>
  `],
  ["创意里", `
    <circle cx="56" cy="118" r="16" fill="#f05a47"/><circle cx="78" cy="110" r="14" fill="#ffd166"/><circle cx="98" cy="122" r="15" fill="#75c6a7"/>
    <rect x="50" y="130" width="60" height="18" rx="7" fill="#f4dcc0"/>
    <path d="M50 130 C68 118 92 118 110 130" stroke="#c28350" stroke-width="5" fill="none"/>
    <circle cx="74" cy="88" r="10" fill="#f05a47"/><path d="M74 98 C68 108 66 114 66 122" stroke="#7b6a58" stroke-width="3"/>
  `],
  ["客运站", `
    <rect x="42" y="106" width="76" height="38" rx="10" fill="#d84332"/>
    <rect x="52" y="112" width="22" height="14" rx="3" fill="#aee0f3"/><rect x="80" y="112" width="24" height="14" rx="3" fill="#aee0f3"/>
    <circle cx="58" cy="146" r="8" fill="#2b3036"/><circle cx="100" cy="146" r="8" fill="#2b3036"/>
    <path d="M46 94 L110 94 L118 106 L38 106 Z" fill="#f4c04c"/>
  `],
  ["东方汇酒店", `
    ${cube(44, 100, 68, 46, "#f1d8b6")}
    <path d="M48 92 L78 72 L108 92 Z" fill="#d94d38"/>
    <rect x="62" y="116" width="12" height="12" fill="#89c8d9"/><rect x="84" y="116" width="12" height="12" fill="#89c8d9"/>
    <rect x="72" y="136" width="18" height="18" rx="4" fill="#7d4934"/>
  `],
  ["北鹅产业园", `
    <path d="M54 132 C48 112 64 98 82 108 C94 114 100 128 92 140 C78 152 60 146 54 132 Z" fill="#f7f6ee" stroke="#d6cfc0" stroke-width="3"/>
    <path d="M80 108 C86 92 104 94 106 108 C98 106 92 108 88 118" fill="#f7f6ee" stroke="#d6cfc0" stroke-width="3"/>
    <circle cx="98" cy="102" r="2" fill="#2c2c2c"/>
    ${cube(34, 118, 34, 26, "#8fb7c9")}
  `],
  ["农机产业园", `
    <rect x="50" y="112" width="58" height="28" rx="6" fill="#c4772f"/>
    <circle cx="62" cy="142" r="14" fill="#5c3a22"/><circle cx="102" cy="142" r="10" fill="#5c3a22"/>
    <circle cx="62" cy="142" r="6" fill="#d5a64e"/><circle cx="102" cy="142" r="4" fill="#d5a64e"/>
    <path d="M44 110 L66 94 L92 112" fill="#e49d3e"/>
    <path d="M112 118 C122 106 130 102 138 100" stroke="#d6ae4d" stroke-width="5" fill="none"/>
  `],
  ["中国大豆城", `
    <path d="M38 130 C56 106 96 104 116 128 C92 144 62 146 38 130 Z" fill="#a9cf5a"/>
    <path d="M46 130 C70 120 92 120 112 128" stroke="#6a9f38" stroke-width="4" fill="none"/>
    <ellipse cx="74" cy="104" rx="14" ry="8" fill="#f2ca4f"/><ellipse cx="92" cy="112" rx="14" ry="8" fill="#f2ca4f"/>
    ${cube(104, 112, 28, 30, "#d99638")}
  `],
  ["立交桥", `
    <path d="M32 134 C58 104 96 102 122 132" fill="none" stroke="#e6d2a0" stroke-width="14" stroke-linecap="round"/>
    <path d="M44 104 C74 136 96 142 126 112" fill="none" stroke="#f0bd41" stroke-width="10" stroke-linecap="round"/>
    <path d="M32 134 C58 104 96 102 122 132" fill="none" stroke="#fff7de" stroke-width="3" stroke-dasharray="8 7"/>
  `],
  ["嫩江站", `
    <ellipse cx="78" cy="126" rx="46" ry="20" fill="#dfeaf0"/>
    <path d="M40 126 C58 102 98 102 118 126 C96 138 60 138 40 126 Z" fill="#8ac0d8"/>
    <rect x="56" y="116" width="18" height="8" rx="3" fill="#2b4658"/><rect x="82" y="116" width="18" height="8" rx="3" fill="#2b4658"/>
    <path d="M42 144 L116 144" stroke="#44535d" stroke-width="5" stroke-linecap="round"/>
  `],
  ["冰花啤酒", `
    <rect x="54" y="104" width="32" height="44" rx="8" fill="#f4a32f"/>
    <path d="M86 114 C110 112 112 144 88 142" fill="none" stroke="#f4a32f" stroke-width="9"/>
    <path d="M56 104 C60 94 82 94 86 104" fill="#fff5d3"/>
    <rect x="34" y="120" width="20" height="30" rx="5" fill="#8b5a2b"/>
    <path d="M108 94 l8 8 m0 -8 l-8 8 m4 -12 v16 m-8 -8 h16" stroke="#8fd3ea" stroke-width="3" stroke-linecap="round"/>
  `],
  ["中小企业孵化园", `
    ${cube(40, 106, 38, 42, "#74b77a")}
    ${cube(82, 96, 42, 52, "#83cbb2")}
    <rect x="50" y="118" width="8" height="8" fill="#efffd8"/><rect x="92" y="110" width="8" height="8" fill="#efffd8"/><rect x="106" y="116" width="8" height="8" fill="#efffd8"/>
    <path d="M36 148 C58 136 104 136 126 148" stroke="#5da868" stroke-width="7" stroke-linecap="round"/>
  `],
  ["腾克木鲁大道", `
    <path d="M44 148 C56 124 74 108 108 92" fill="none" stroke="#5c5f68" stroke-width="24" stroke-linecap="round"/>
    <path d="M44 148 C56 124 74 108 108 92" fill="none" stroke="#f4c24d" stroke-width="4" stroke-dasharray="10 8"/>
    <path d="M92 88 l6 13 14 2 -10 10 2 14 -12 -7 -13 7 3 -14 -10 -10 14 -2 Z" fill="#d83d2b"/>
  `],
  ["古驿雄风", `
    <path d="M52 132 C62 106 80 90 102 82 L110 98 C92 110 82 126 78 148 Z" fill="#5a3728"/>
    <path d="M42 144 L108 126" stroke="#6f4632" stroke-width="12" stroke-linecap="round"/>
    <path d="M74 96 L118 84" stroke="#9b6b3f" stroke-width="9" stroke-linecap="round"/>
    <path d="M34 150 C58 140 94 138 124 148" stroke="#d8aa52" stroke-width="7" stroke-linecap="round"/>
  `],
];

fs.mkdirSync(outDir, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Nenjiang 3D isometric icon collection">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff8e6"/>
      <stop offset="1" stop-color="#f3dfb9"/>
    </linearGradient>
    <linearGradient id="baseTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffc44d"/>
      <stop offset="1" stop-color="#f28a2e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff4a8"/>
      <stop offset=".55" stop-color="#f2bd37"/>
      <stop offset="1" stop-color="#c77a12"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#7d5a2a" flood-opacity=".22"/>
    </filter>
    <style>
      .shadow{fill:#8c6b3a;opacity:.18;filter:blur(2px)}
      .base-top{fill:url(#baseTop)}
      .base-left{fill:#d26f23}
      .base-right{fill:#b95c1f}
      .icon *{vector-effect:non-scaling-stroke}
    </style>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${icons.map(([name, body], i) => iconWrap(i, name, body)).join("\n")}
</svg>
`;

fs.writeFileSync(outSvg, svg);
console.log(outSvg);
