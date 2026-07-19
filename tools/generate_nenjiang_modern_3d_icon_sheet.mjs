#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const outDir = "outputs/嫩江_陆地轮廓";
const outSvg = path.join(outDir, "nenjiang_modern_3d_icon_collection.svg");
const W = 1440;
const H = 960;
const cellW = 240;
const cellH = 240;

const subjects = [
  ["浮桥", "bridge"],
  ["水师营遗址", "gate"],
  ["嫩江春白酒", "liquor"],
  ["嫩江大酒店", "hotel"],
  ["玉带金珠", "pearl"],
  ["博物馆", "museum"],
  ["墨尔根老街", "oldstreet"],
  ["驿站公园", "park"],
  ["墨尔根副都统衙门遗址", "yamen"],
  ["商业区", "commerce"],
  ["创意里", "creative"],
  ["客运站", "bus"],
  ["东方汇酒店", "inn"],
  ["北鹅产业园", "goose"],
  ["农机产业园", "tractor"],
  ["中国大豆城", "soy"],
  ["立交桥", "overpass"],
  ["嫩江站", "train"],
  ["冰花啤酒", "beer"],
  ["中小企业孵化园", "incubator"],
  ["腾克木鲁大道", "avenue"],
  ["古驿雄风", "postroad"],
];

function esc(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function wrap(i, name, body) {
  const col = i % 6;
  const row = Math.floor(i / 6);
  const x = col * cellW + 42;
  const y = row * cellH + 42;
  return `
  <g class="icon" data-name="${esc(name)}" transform="translate(${x} ${y})">
    <ellipse class="ambient" cx="78" cy="162" rx="72" ry="25"/>
    <path class="plinth-top" d="M18 127 C18 120 24 114 34 109 L68 90 C75 86 82 86 89 90 L124 109 C134 115 140 120 140 127 C140 134 134 140 124 146 L89 166 C82 170 75 170 68 166 L34 146 C24 140 18 134 18 127 Z"/>
    <path class="plinth-front" d="M18 127 C18 134 24 140 34 146 L68 166 C75 170 82 170 89 166 L124 146 C134 140 140 134 140 127 L140 145 C140 152 134 158 124 164 L89 184 C82 188 75 188 68 184 L34 164 C24 158 18 152 18 145 Z"/>
    <path class="plinth-glow" d="M39 122 L75 102 C78 100 82 100 85 102 L119 122 C122 124 122 128 119 130 L85 150 C82 152 78 152 75 150 L39 130 C36 128 36 124 39 122 Z"/>
    ${body}
  </g>`;
}

function building(x, y, w, h, fill, roof = "#ff6b3d") {
  return `
    <path class="top" d="M${x} ${y} l${w / 2} -${w * .28} l${w / 2} ${w * .28} l-${w / 2} ${w * .28} Z" fill="${fill}"/>
    <path d="M${x} ${y} l${w / 2} ${w * .28} v${h} l-${w / 2} -${w * .28} Z" fill="${fill}" opacity=".86"/>
    <path d="M${x + w} ${y} l-${w / 2} ${w * .28} v${h} l${w / 2} -${w * .28} Z" fill="${fill}" opacity=".66"/>
    <path d="M${x + 4} ${y - 8} l${w / 2 - 4} -${w * .25} l${w / 2 - 4} ${w * .25} l-${w / 2 - 4} ${w * .25} Z" fill="${roof}"/>
  `;
}

function icon(kind) {
  const commonGlass = `filter="url(#objectShadow)"`;
  const map = {
    bridge: `
      <g ${commonGlass}>
        <path d="M34 122 C54 92 102 92 126 122" fill="none" stroke="url(#river)" stroke-width="26" stroke-linecap="round"/>
        <path d="M43 121 L115 121" stroke="#f4c85d" stroke-width="12" stroke-linecap="round"/>
        <path d="M45 111 L45 132 M64 108 L64 135 M84 108 L84 135 M104 111 L104 132" stroke="#9c6a34" stroke-width="5" stroke-linecap="round"/>
        <path d="M45 116 L115 116" stroke="#fff5bd" stroke-width="3" opacity=".7"/>
      </g>`,
    gate: `
      <g ${commonGlass}>
        <path d="M40 100 L78 66 L116 100 Z" fill="url(#redGloss)"/>
        <rect x="48" y="96" width="60" height="50" rx="10" fill="url(#redGloss)"/>
        <rect x="67" y="114" width="22" height="31" rx="6" fill="#6f2d2a"/>
        <circle cx="52" cy="91" r="6" fill="#ffd76a"/><circle cx="104" cy="91" r="6" fill="#ffd76a"/>
        <path d="M50 102 H106" stroke="#ffd97a" stroke-width="4" opacity=".7"/>
      </g>`,
    liquor: `
      <g ${commonGlass}>
        <ellipse cx="72" cy="116" rx="31" ry="18" fill="#c77a3d"/>
        <path d="M42 115 C42 92 102 92 102 115 L94 150 C90 168 54 168 50 150 Z" fill="url(#clay)"/>
        <rect x="93" y="75" width="19" height="58" rx="8" fill="#f9f3e6"/>
        <rect x="97" y="88" width="11" height="25" rx="4" fill="#72b9d8"/>
        <path d="M42 142 C61 132 92 132 112 143" stroke="#f7ce62" stroke-width="8" stroke-linecap="round"/>
      </g>`,
    hotel: `
      <g ${commonGlass}>
        ${building(42, 91, 74, 60, "url(#blueGlass)", "#ff8142")}
        <rect x="58" y="104" width="11" height="11" rx="2" fill="#fff1a8"/>
        <rect x="78" y="109" width="11" height="11" rx="2" fill="#fff1a8"/>
        <rect x="78" y="134" width="17" height="22" rx="5" fill="#24546c"/>
      </g>`,
    pearl: `
      <g ${commonGlass}>
        <path d="M34 132 C57 96 96 153 123 107" fill="none" stroke="url(#river)" stroke-width="17" stroke-linecap="round"/>
        <circle cx="80" cy="112" r="31" fill="url(#goldBall)"/>
        <ellipse cx="69" cy="101" rx="9" ry="12" fill="#fff8bb" opacity=".85"/>
      </g>`,
    museum: `
      <g ${commonGlass}>
        <path d="M38 103 L78 72 L118 103 Z" fill="url(#terracotta)"/>
        <rect x="47" y="103" width="62" height="44" rx="8" fill="#f2d5a3"/>
        <rect x="57" y="113" width="9" height="31" rx="2" fill="#9b6150"/>
        <rect x="74" y="113" width="9" height="31" rx="2" fill="#9b6150"/>
        <rect x="91" y="113" width="9" height="31" rx="2" fill="#9b6150"/>
      </g>`,
    oldstreet: `
      <g ${commonGlass}>
        <path d="M39 102 L78 72 L117 102" fill="none" stroke="#235c78" stroke-width="12" stroke-linecap="round"/>
        <rect x="48" y="102" width="60" height="39" rx="8" fill="#3f91b8"/>
        <path d="M36 132 H120" stroke="#203f50" stroke-width="9" stroke-linecap="round"/>
        <rect x="58" y="113" width="13" height="20" rx="3" fill="#ffe08a"/>
        <rect x="86" y="113" width="13" height="20" rx="3" fill="#ffe08a"/>
      </g>`,
    park: `
      <g ${commonGlass}>
        <path d="M38 129 C55 105 99 105 120 129 C98 151 58 151 38 129 Z" fill="url(#greenGloss)"/>
        <path d="M54 137 C73 118 91 118 109 137" stroke="#f0d06d" stroke-width="8" stroke-linecap="round" fill="none"/>
        <circle cx="56" cy="108" r="17" fill="#50ad65"/>
        <circle cx="104" cy="113" r="15" fill="#66bd72"/>
        <path d="M70 119 L83 106 L98 119" fill="none" stroke="#9c6635" stroke-width="6"/>
      </g>`,
    yamen: `
      <g ${commonGlass}>
        <path d="M37 106 L78 70 L119 106 Z" fill="url(#redGloss)"/>
        <rect x="45" y="106" width="66" height="42" rx="8" fill="url(#redGloss)"/>
        <rect x="65" y="119" width="26" height="29" rx="6" fill="#74302a"/>
        <path d="M34 150 H123" stroke="#74482d" stroke-width="8" stroke-linecap="round"/>
      </g>`,
    commerce: `
      <g ${commonGlass}>
        ${building(39, 103, 78, 42, "#f4a43a", "#ee5444")}
        <rect x="50" y="117" width="17" height="22" rx="3" fill="#70c4e2"/>
        <rect x="73" y="119" width="17" height="20" rx="3" fill="#fff2c0"/>
        <rect x="96" y="117" width="13" height="22" rx="3" fill="#70c4e2"/>
      </g>`,
    creative: `
      <g ${commonGlass}>
        <circle cx="56" cy="117" r="17" fill="#ff5b4b"/>
        <circle cx="79" cy="109" r="15" fill="#ffd461"/>
        <circle cx="100" cy="122" r="16" fill="#71d3af"/>
        <rect x="48" y="130" width="63" height="20" rx="10" fill="#fff0cf"/>
        <path d="M73 97 C68 109 66 116 67 125" stroke="#776855" stroke-width="4" fill="none"/>
        <circle cx="74" cy="87" r="10" fill="#ff5b4b"/>
      </g>`,
    bus: `
      <g ${commonGlass}>
        <rect x="40" y="106" width="80" height="42" rx="13" fill="url(#redGloss)"/>
        <rect x="52" y="113" width="23" height="15" rx="4" fill="#abe4fa"/>
        <rect x="82" y="113" width="25" height="15" rx="4" fill="#abe4fa"/>
        <circle cx="59" cy="150" r="8" fill="#28343d"/>
        <circle cx="102" cy="150" r="8" fill="#28343d"/>
        <path d="M46 98 H110 L119 106 H38 Z" fill="#ffd15d"/>
      </g>`,
    inn: `
      <g ${commonGlass}>
        ${building(44, 101, 70, 48, "#f3d7ae", "#d84e3e")}
        <rect x="61" y="117" width="13" height="13" rx="3" fill="#8fd2e5"/>
        <rect x="86" y="117" width="13" height="13" rx="3" fill="#8fd2e5"/>
        <rect x="72" y="137" width="19" height="20" rx="5" fill="#7f4b35"/>
      </g>`,
    goose: `
      <g ${commonGlass}>
        <path d="M54 132 C48 111 65 97 84 107 C98 114 102 129 92 141 C77 154 59 147 54 132 Z" fill="#fffdf2" stroke="#d8d0bd" stroke-width="3"/>
        <path d="M81 107 C87 90 107 92 109 108 C99 106 93 109 88 119" fill="#fffdf2" stroke="#d8d0bd" stroke-width="3"/>
        <circle cx="100" cy="101" r="2.5" fill="#25313b"/>
        <path d="M108 107 L119 111 L108 115 Z" fill="#f0a13c"/>
        ${building(32, 119, 36, 27, "#82bfd0", "#9ed18f")}
      </g>`,
    tractor: `
      <g ${commonGlass}>
        <rect x="50" y="112" width="60" height="29" rx="8" fill="#c5782e"/>
        <path d="M43 111 L66 93 L94 112 Z" fill="#eca643"/>
        <circle cx="63" cy="143" r="15" fill="#4d3323"/>
        <circle cx="104" cy="143" r="10" fill="#4d3323"/>
        <circle cx="63" cy="143" r="6" fill="#e3b65c"/>
        <circle cx="104" cy="143" r="4" fill="#e3b65c"/>
        <path d="M114 119 C124 108 131 104 139 101" stroke="#d7ac47" stroke-width="5" fill="none"/>
      </g>`,
    soy: `
      <g ${commonGlass}>
        <path d="M36 130 C55 106 99 104 120 128 C96 147 60 147 36 130 Z" fill="url(#greenGloss)"/>
        <path d="M46 131 C70 120 96 120 115 129" stroke="#5d9e3a" stroke-width="4" fill="none"/>
        <ellipse cx="74" cy="103" rx="14" ry="8" fill="#f2cc4f"/>
        <ellipse cx="94" cy="112" rx="14" ry="8" fill="#f2cc4f"/>
        ${building(104, 112, 28, 33, "#d89535", "#f7c65b")}
      </g>`,
    overpass: `
      <g ${commonGlass}>
        <path d="M32 134 C58 101 99 101 126 133" fill="none" stroke="#e7d1a1" stroke-width="15" stroke-linecap="round"/>
        <path d="M45 103 C74 138 99 142 128 112" fill="none" stroke="#ffc74b" stroke-width="11" stroke-linecap="round"/>
        <path d="M33 134 C58 101 99 101 126 133" fill="none" stroke="#fff9df" stroke-width="3" stroke-dasharray="9 7"/>
      </g>`,
    train: `
      <g ${commonGlass}>
        <ellipse cx="79" cy="126" rx="49" ry="22" fill="#e8f0f4"/>
        <path d="M39 126 C58 100 101 100 120 126 C98 140 60 140 39 126 Z" fill="#87c6df"/>
        <rect x="56" y="115" width="19" height="9" rx="4" fill="#263f4f"/>
        <rect x="84" y="115" width="20" height="9" rx="4" fill="#263f4f"/>
        <path d="M42 147 H118" stroke="#3f4d56" stroke-width="5" stroke-linecap="round"/>
      </g>`,
    beer: `
      <g ${commonGlass}>
        <rect x="53" y="104" width="34" height="46" rx="10" fill="url(#goldBall)"/>
        <path d="M87 115 C112 112 114 146 89 143" fill="none" stroke="#f2a430" stroke-width="10"/>
        <path d="M55 104 C60 93 82 93 87 104" fill="#fff8dc"/>
        <rect x="33" y="120" width="21" height="31" rx="6" fill="#8b5a2f"/>
        <path d="M111 94 l8 8 m0 -8 l-8 8 m4 -13 v18 m-9 -9 h18" stroke="#7bd8ef" stroke-width="3" stroke-linecap="round"/>
      </g>`,
    incubator: `
      <g ${commonGlass}>
        ${building(39, 107, 40, 43, "#6dbb79", "#8fd7a0")}
        ${building(82, 97, 44, 54, "#86d0b5", "#a9e2cb")}
        <rect x="50" y="119" width="8" height="8" rx="2" fill="#f2ffe3"/>
        <rect x="93" y="111" width="9" height="9" rx="2" fill="#f2ffe3"/>
        <rect x="108" y="117" width="9" height="9" rx="2" fill="#f2ffe3"/>
        <path d="M35 149 C58 137 104 137 127 149" stroke="#54aa68" stroke-width="8" stroke-linecap="round"/>
      </g>`,
    avenue: `
      <g ${commonGlass}>
        <path d="M43 149 C55 124 75 106 111 90" fill="none" stroke="#515e6c" stroke-width="25" stroke-linecap="round"/>
        <path d="M43 149 C55 124 75 106 111 90" fill="none" stroke="#ffd04f" stroke-width="5" stroke-dasharray="11 9"/>
        <path d="M93 87 l6 13 15 2 -11 10 3 15 -13 -7 -13 7 3 -15 -11 -10 15 -2 Z" fill="#e23e32"/>
      </g>`,
    postroad: `
      <g ${commonGlass}>
        <path d="M53 133 C63 106 81 89 104 81 L112 98 C94 111 83 127 79 150 Z" fill="#59382b"/>
        <path d="M42 145 L111 126" stroke="#704833" stroke-width="13" stroke-linecap="round"/>
        <path d="M75 96 L121 84" stroke="#a06d3d" stroke-width="9" stroke-linecap="round"/>
        <path d="M34 151 C58 141 96 139 126 149" stroke="#d9ad52" stroke-width="8" stroke-linecap="round"/>
      </g>`,
  };
  return map[kind];
}

fs.mkdirSync(outDir, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="pageBg" cx="50%" cy="38%" r="76%">
      <stop offset="0" stop-color="#fff7e5"/>
      <stop offset=".6" stop-color="#f5e1bb"/>
      <stop offset="1" stop-color="#e9c98e"/>
    </radialGradient>
    <linearGradient id="plinthTop" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd96a"/>
      <stop offset=".52" stop-color="#ff9d32"/>
      <stop offset="1" stop-color="#e76f23"/>
    </linearGradient>
    <linearGradient id="plinthSide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d96c23"/>
      <stop offset="1" stop-color="#a9471c"/>
    </linearGradient>
    <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7fd8ff"/>
      <stop offset="1" stop-color="#357fc9"/>
    </linearGradient>
    <linearGradient id="redGloss" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff7a4d"/>
      <stop offset=".65" stop-color="#d93e2c"/>
      <stop offset="1" stop-color="#9e2d2a"/>
    </linearGradient>
    <linearGradient id="blueGlass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9fe9ff"/>
      <stop offset=".55" stop-color="#419bc8"/>
      <stop offset="1" stop-color="#25627d"/>
    </linearGradient>
    <linearGradient id="terracotta" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff9b62"/>
      <stop offset="1" stop-color="#b94735"/>
    </linearGradient>
    <linearGradient id="clay" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd697"/>
      <stop offset="1" stop-color="#bf6b3a"/>
    </linearGradient>
    <linearGradient id="greenGloss" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b9ec82"/>
      <stop offset=".7" stop-color="#63b65c"/>
      <stop offset="1" stop-color="#3f8d4c"/>
    </linearGradient>
    <radialGradient id="goldBall" cx="34%" cy="28%" r="70%">
      <stop offset="0" stop-color="#fff7ad"/>
      <stop offset=".52" stop-color="#f6bd32"/>
      <stop offset="1" stop-color="#b96e13"/>
    </radialGradient>
    <filter id="objectShadow" x="-35%" y="-35%" width="170%" height="180%">
      <feDropShadow dx="0" dy="10" stdDeviation="6" flood-color="#6d461e" flood-opacity=".28"/>
    </filter>
    <filter id="bgNoise">
      <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 .045"/>
      </feComponentTransfer>
    </filter>
    <style>
      .ambient{fill:#7a5622;opacity:.18;filter:blur(4px)}
      .plinth-top{fill:url(#plinthTop);filter:url(#objectShadow)}
      .plinth-front{fill:url(#plinthSide)}
      .plinth-glow{fill:#ffe687;opacity:.36}
      .top{opacity:.92}
      .icon{transform-box:fill-box;transform-origin:center}
    </style>
  </defs>
  <rect width="100%" height="100%" fill="url(#pageBg)"/>
  <rect width="100%" height="100%" filter="url(#bgNoise)" opacity=".42"/>
  ${subjects.map(([name, kind], i) => wrap(i, name, icon(kind))).join("\n")}
</svg>
`;

fs.writeFileSync(outSvg, svg);
console.log(outSvg);
