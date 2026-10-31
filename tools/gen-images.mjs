#!/usr/bin/env node
/**
 * 利特酒店 · 图片生成脚本
 *
 * 从 OpenCode 配置中读取 OpenAI 兼容的图像接口，
 * 按本文件里的提示词生成照片。
 *
 * 用法：
 *   node tools/gen-images.mjs            # 生成全部（已存在的跳过）
 *   node tools/gen-images.mjs hero onsen # 只生成指定条目
 *   node tools/gen-images.mjs --force    # 覆盖已有图片
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "assets", "photos");

/* ------------------------------------------------------------------ */
/* 配置                                                                */
/* ------------------------------------------------------------------ */

const PROVIDER = "aletyn-ai-api-xai";
const MODEL = process.env.IMAGE_MODEL || "grok-imagine-image";

const readConfig = () => {
  const candidates = [
    path.join(os.homedir(), ".config", "opencode", "opencode.json"),
    path.join(process.env.APPDATA || "", "opencode", "opencode.json"),
    path.join(os.homedir(), ".opencode", "opencode.json"),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  }
  throw new Error("找不到 opencode.json");
};

const config = readConfig();
const options = config?.provider?.[PROVIDER]?.options || {};
const API_KEY =
  options.apiKey ||
  process.env.OPENCODE_IMAGE_API_KEY ||
  process.env.OPENAI_API_KEY;
const BASE_URL = (options.baseURL || "https://api.openai.com/v1").replace(/\/+$/, "");

if (!API_KEY) throw new Error("缺少 API Key");

/* ------------------------------------------------------------------ */
/* 通用风格：所有照片共享同一套光线、色彩与胶片质感                     */
/* ------------------------------------------------------------------ */

const STYLE = [
  "Photorealistic editorial photograph, 35mm film, Kodak Portra 400, soft overcast natural light, ",
  "muted earth tones and bamboo green, fine grain, slight vignette, ",
  "no people, no faces, no readable text, no signs, no logos, no watermark, ",
  "slightly imperfect, like a photo the hotel itself took, not a luxury advertisement.",
].join("");

const SCENE = (text) => `${text} ${STYLE}`;

/* ------------------------------------------------------------------ */
/* 图片清单                                                            */
/* ------------------------------------------------------------------ */

const IMAGES = [
  {
    id: "hero",
    file: "hero.jpg",
    width: 1536,
    height: 1024,
    alt: "利特酒店夜色中的庭院与暖灯",
    prompt: SCENE(
      "Blue hour at a small boutique mountain hotel courtyard in southern Zhejiang, China. Wet stone steps, tall moso bamboo on both sides. A low two-story timber and rammed-earth building, a few windows glowing warm amber, one old copper lantern under the eaves. The ridge behind disappears into mist. Wide angle, slightly low viewpoint, quiet and restrained. No hanging cloth, no laundry."
    ),
  },
  {
    id: "story",
    file: "story-mountain.jpg",
    width: 1536,
    height: 1152,
    alt: "青岚山晨雾中的山脊与竹海",
    prompt: SCENE(
      "Dawn over a mountain ridge in southern Zhejiang. A sea of cloud rising from the valley, dense moso bamboo reduced to silhouettes in the fog. A short stretch of wet stone steps in the foreground, no buildings, no houses, no doors. Telephoto compression, layered, cold, damp, quiet."
    ),
  },
  {
    id: "room-villa",
    file: "room-villa.jpg",
    width: 1536,
    height: 1024,
    alt: "利特别墅卧室，落地窗外是竹林",
    prompt: SCENE(
      "A quiet villa bedroom in a Zhejiang mountain hotel. Floor-to-ceiling window looking into dense bamboo, dark timber frame. A low wide bed with off-white linen, a folded grey-green wool blanket on the bench at the foot. Matte dark wood floor, one coarse local ceramic vase with two bamboo stems. Soft morning light, thin mist outside."
    ),
  },
  {
    id: "room-suite",
    file: "room-suite.jpg",
    width: 1536,
    height: 1152,
    alt: "山居套房，暖色灯光与木地板",
    prompt: SCENE(
      "A mountain suite at dusk. A warm wall lamp just switched on, wood floor catching the light. A freestanding bathtub beside the window, valley and darkening bamboo outside. Bed neatly made, linen curtain half drawn, a half-finished cup of tea on the nightstand. Shot from inside the room toward the window, lived-in but not messy."
    ),
  },
  {
    id: "room-forest",
    file: "room-forest.jpg",
    width: 1536,
    height: 1152,
    alt: "林间客房，竹影投在白墙上",
    prompt: SCENE(
      "A small forest guest room in the afternoon. Bamboo-leaf shadows moving on a plain white wall. A simple single bed with soft washed white linen. A small wooden table by the window with an open book and a white porcelain cup. Almost no decoration, one patch of daylight on the floor."
    ),
  },
  {
    id: "dining",
    file: "dining.jpg",
    width: 1280,
    height: 1536,
    alt: "山中厨房的时令晚餐",
    prompt: SCENE(
      "Dinner from a small mountain kitchen. A heavy dark wood table, seasonal dishes in locally fired coarse ceramic: bamboo shoots, mountain mushrooms, a steamed stream fish, a small dish of pickles. A weak copper candle at the corner. A fogged window behind, rain and bamboo outside. Slightly overhead, dim and warm, a private supper rather than a restaurant advertisement. No menus, no writing."
    ),
  },
  {
    id: "onsen",
    file: "onsen.jpg",
    width: 1280,
    height: 1536,
    alt: "温泉石池与蒸汽",
    prompt: SCENE(
      "An outdoor hot spring after sunset, set into a Zhejiang hillside. A stone pool, white steam rising, the surface reflecting a bamboo fence and the last light. A worn stone at the edge holds a wooden ladle and a folded white towel. Bamboo all around. Quiet, damp, slightly cold. No signs."
    ),
  },
  {
    id: "season-spring",
    file: "season-spring.jpg",
    width: 1280,
    height: 1280,
    alt: "春天，竹林里的春笋",
    prompt: SCENE(
      "Spring on the floor of a Zhejiang bamboo forest. A few young bamboo shoots pushing through wet leaves and soil, an overturned woven bamboo basket nearby, a narrow footpath further back. Morning light through the leaves, moisture in the air. Close to medium, plain and real. No people."
    ),
  },
  {
    id: "season-summer",
    file: "season-summer.jpg",
    width: 1280,
    height: 1280,
    alt: "夏日竹林与林间泳池",
    prompt: SCENE(
      "Midsummer in a bamboo forest. A narrow stone path leading to a small dark pool among the trees, water reflecting green bamboo light. Two old wooden lounge chairs and a closed umbrella at the edge. Bright but not harsh. No people, no signage."
    ),
  },
  {
    id: "season-autumn",
    file: "season-autumn.jpg",
    width: 1280,
    height: 1280,
    alt: "秋日山路上的枫与银杏",
    prompt: SCENE(
      "An autumn mountain road in southern Zhejiang. Wet asphalt covered with ginkgo leaves and a few red maple leaves. A bamboo fence along the road, no stone marker, no carving, no letters anywhere. Thin fog, a timber eave just visible in the distance. Low angle, the road in the foreground, cool and quiet. No readable carving."
    ),
  },
  {
    id: "season-winter",
    file: "season-winter.jpg",
    width: 1280,
    height: 1280,
    alt: "冬日雪中的温泉与白雾",
    prompt: SCENE(
      "A winter evening. Thin snow on bamboo leaves and the rim of a stone hot-spring pool. Thick white steam rising from the water, snow on the stones, a bamboo fence bent by the snow. A warm window in a timber house far behind. Cold against warm, quiet. No signs."
    ),
  },
  {
    id: "arrive",
    file: "arrive.jpg",
    width: 1536,
    height: 1024,
    alt: "通往酒店的山路与云海",
    prompt: SCENE(
      "The last kilometre of a narrow mountain road in southern Zhejiang, barely wide enough for one car. A rock face and ferns on one side, a simple guardrail and a sea of cloud on the other. Dark roof tiles and bamboo on the far slope. Early morning, clear air, a real driver's viewpoint. No road signs with writing."
    ),
  },
  {
    id: "archive-door",
    file: "archive-door.jpg",
    width: 1024,
    height: 1280,
    alt: "四楼走廊尽头那扇门",
    prompt: SCENE(
      "A hotel corridor late at night, fourth floor. A long hall with worn dark-red carpet, dark wooden doors on both sides, one dim wall lamp, most lights off. At the far end a door with a blank weathered wooden maintenance tag hanging from the handle, a thin line of warm light under the door. Dust in the air. Grainy low-light snapshot, slightly wrong in its quiet. The tag has no readable letters."
    ),
  },
  {
    id: "archive-clock",
    file: "archive-clock.jpg",
    width: 1280,
    height: 1024,
    alt: "凌晨三点零三分的走廊挂钟",
    prompt: SCENE(
      "Close-up of an old wall clock in a hotel corridor. The hands are stopped just after three, a hairline crack in the glass, tarnished brass bezel, blurred dark wood wall and a little wall-lamp light behind. Low light, obvious grain, a phone photo taken by night staff. No numerals that form words, no logo."
    ),
  },
  {
    id: "archive-laundry",
    file: "archive-laundry.jpg",
    width: 1280,
    height: 1024,
    alt: "洗衣房里多出来的一套床单",
    prompt: SCENE(
      "A hotel back-of-house laundry room. A metal cart stacked with neat piles of white sheets and pillowcases, one extra set tied with faded cotton string sitting alone on top. Cool fluorescent light, old tiles, wet floor. Flat documentary composition, an internal work record. No labels, no writing."
    ),
  },
];

/* ------------------------------------------------------------------ */
/* 生成                                                                */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const generate = async (item) => {
  const body = {
    model: MODEL,
    prompt: item.prompt,
    n: 1,
    size: `${item.width}x${item.height}`,
    response_format: "b64_json",
  };

  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const entry = data?.data?.[0];
  if (!entry) throw new Error("接口没有返回图片");

  const buf = entry.b64_json
    ? Buffer.from(entry.b64_json, "base64")
    : Buffer.from(await (await fetch(entry.url)).arrayBuffer());

  fs.writeFileSync(path.join(OUT_DIR, item.file), buf);
  return buf.length;
};

const main = async () => {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--"));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const queue = IMAGES.filter(
    (item) => only.length === 0 || only.includes(item.id)
  );

  let ok = 0;
  let skipped = 0;

  for (const item of queue) {
    const target = path.join(OUT_DIR, item.file);
    if (!force && fs.existsSync(target) && fs.statSync(target).size > 1000) {
      console.log(`跳过 ${item.id}（已存在）`);
      skipped += 1;
      continue;
    }
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const started = Date.now();
        const bytes = await generate(item);
        console.log(
          `完成 ${item.id} → ${item.file} （${(bytes / 1024).toFixed(0)} KB，${(
            (Date.now() - started) / 1000
          ).toFixed(0)}s）`
        );
        ok += 1;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        console.warn(`重试 ${item.id}（${attempt}/3）：${error.message}`);
        await sleep(4000 * attempt);
      }
    }
    if (lastError) {
      console.error(`失败 ${item.id}`);
    }
  }

  console.log(`\n完成 ${ok} 张，跳过 ${skipped} 张。`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
