"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DoughAvatar,
  EMOTIONS,
  MOCHI,
  PLAIN,
  mochiIn,
  type ColourwayName,
  type Emotion,
  type FaceSpec,
} from "mochi-avatar";
import { Download, FolderOpen, X } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { loadVoicePack, type VoicePack } from "@/lib/mochi-voice-pack";

type MochiClientProps = {
  homepageName: string;
  ttsApiUrl: string;
};

type Lang = "zh" | "en" | "yue";
type PetId = "mochi" | "bao";

const COLOURWAYS: ColourwayName[] = [
  "matcha",
  "sakura",
  "kinako",
  "yuzu",
  "ramune",
  "budo",
];

const MOTIONS = ["nod", "sway", "hop", "swing", "turn", "wander"] as const;

const PET_OPTIONS: { id: PetId; label: string }[] = [
  { id: "bao", label: "Bao" },
  { id: "mochi", label: "Mochi" },
];

// Steamed-bun companion built from PLAIN so she is visibly not Mochi.
// Outline traced from public/avatar.png: a dome tapering to a soft peak, widest
// ~40% up, on a broad rounded base. The knot and pleats can't be drawn by the engine.
const BAO: FaceSpec = {
  ...PLAIN,
  bodyH: 82,
  waist: 0.4,
  upperShoulder: 1.7,
  lowerShoulder: 2.6,
  cheekAlpha: 0.3,
  cheekX: 0.58,
  cheekY: 0.38,
  cheekR: 11,
  colBody: "#f3e2c7",
  colShadow: "#e5cfaa",
  colInk: "#5c4632",
  colCheek: "#ef9a8f",
  colGlint: "#ffffff",
};

function faceForPet(pet: PetId, colourway: ColourwayName): FaceSpec {
  return pet === "bao" ? BAO : mochiIn(colourway, MOCHI);
}

type MotionName = (typeof MOTIONS)[number];

// A line Mochi can say. `audio` is a pre-recorded clip URL; leave it empty and the
// sentence is spoken through the Cantonese TTS instead. `emotion` is one of the
// Mochi emotions (or empty to keep the current face).
type SayLine = { sentence: string; audio: string; emotion?: string };

const BUBBLE_LINGER_MS = 2500;

// Where the speech bubble's tail points, as fractions of the canvas (0..1, origin top-left).
// The bubble grows up and to the right from this point.
const BUBBLE_ANCHOR = { x: 0.62, y: 0.4 };

// Bottom-centre of Bao's steam, as fractions of the canvas; y is her head top in fit-canvas.
const STEAM_ANCHOR = { x: 0.5, y: 0.47 };
const STEAM_DURATION_MS = 3000;

const LANG_OPTIONS: { id: Lang; label: string }[] = [
  { id: "yue", label: "粵語" },
  { id: "zh", label: "普通话" },
  { id: "en", label: "English" },
];

const COPY: Record<
  Lang,
  {
    hint: string;
    loading: string;
    emotion: string;
    motion: string;
    colourway: string;
    stop: string;
    poke: string;
    say: string;
    sayPlaceholder: string;
    sayLoading: string;
    saySentences: SayLine[];
    saySentencesExampleLabel: string;
    saySentencesExampleLink: string;
    loadVoicePack: string;
    clearVoicePack: string;
    voicePackLoaded: string;
    voicePackError: string;
    sayCustomPlaceholder: string;
    sayCustom: string;
    sayOr: string;
    poweredBy: string;
    ariaAvatar: string;
    emotions: Record<Emotion, string>;
    motions: Record<MotionName, string>;
    steam: string;
    colourways: Record<ColourwayName, string>;
  }
> = {
  zh: {
    hint: "移动鼠标让她看你 · 点击戳她 · 用下方控件互动",
    loading: "加载中…",
    emotion: "表情",
    motion: "动作",
    colourway: "配色",
    stop: "停止",
    poke: "戳一下",
    say: "讲点咩",
    sayPlaceholder: "选一句让 Mochi 讲…",
    sayLoading: "Mochi 正在准备…",
    saySentencesExampleLabel: "下载语音包示例",
    saySentencesExampleLink: "/mochi/voice-pack-yue.zip",
    loadVoicePack: "加载本地语音包",
    clearVoicePack: "恢复默认",
    voicePackLoaded: "已加载语音包",
    voicePackError: "语音包读取失败",
    sayCustomPlaceholder: "输入任意一句…",
    sayCustom: "发音",
    sayOr: "或",
    saySentences: [
      { sentence: "你好呀！我是 Mochi～", audio: "" },
      { sentence: "早上好！今天也要开开心心哦！", audio: "" },
      { sentence: "吃饭了吗？", audio: "" },
      { sentence: "一起去喝早茶吃点心吧！", audio: "" },
      { sentence: "今天天气真好，出去走走吧！", audio: "" },
      { sentence: "谢谢你陪我聊天！", audio: "" },
      { sentence: "拜拜，下次见！", audio: "" },
    ],
    poweredBy: "技术支持",
    ariaAvatar: "可互动的 Mochi 形象",
    emotions: {
      neutral: "平静",
      happy: "开心",
      shy: "害羞",
      sad: "难过",
      angry: "生气",
      surprised: "惊讶",
      thinking: "思考",
      sleepy: "困倦",
    },
    motions: {
      nod: "点头",
      sway: "摇摆",
      hop: "跳跃",
      swing: "晃动",
      turn: "转身",
      wander: "徘徊",
    },
    steam: "冒蒸汽",
    colourways: {
      matcha: "抹茶",
      sakura: "樱花",
      kinako: "黄豆粉",
      yuzu: "柚子",
      ramune: "波子汽水",
      budo: "葡萄",
    },
  },
  en: {
    hint: "Move your pointer to look · click to poke · use the controls below",
    loading: "Loading…",
    emotion: "Emotion",
    motion: "Motion",
    colourway: "Colourway",
    stop: "stop",
    poke: "poke",
    say: "Say something",
    sayPlaceholder: "Pick a line for Mochi to say…",
    sayLoading: "Mochi is getting ready…",
    saySentencesExampleLabel: "Download voice pack example",
    saySentencesExampleLink: "/mochi/voice-pack-yue.zip",
    loadVoicePack: "Load local voice pack",
    clearVoicePack: "Use default",
    voicePackLoaded: "Voice pack loaded",
    voicePackError: "Couldn't read voice pack",
    sayCustomPlaceholder: "Type any sentence…",
    sayCustom: "Speak",
    sayOr: "or",
    saySentences: [
      { sentence: "Hi there! I'm Mochi~", audio: "" },
      { sentence: "Good morning! Let's have a happy day!", audio: "" },
      { sentence: "Have you eaten yet?", audio: "" },
      { sentence: "Let's go for dim sum together!", audio: "" },
      { sentence: "Lovely weather today, let's go for a walk!", audio: "" },
      { sentence: "Thanks for chatting with me!", audio: "" },
      { sentence: "Bye-bye, see you next time!", audio: "" },
    ],
    poweredBy: "Powered by",
    ariaAvatar: "Interactive Mochi avatar",
    emotions: {
      neutral: "neutral",
      happy: "happy",
      shy: "shy",
      sad: "sad",
      angry: "angry",
      surprised: "surprised",
      thinking: "thinking",
      sleepy: "sleepy",
    },
    motions: {
      nod: "nod",
      sway: "sway",
      hop: "hop",
      swing: "swing",
      turn: "turn",
      wander: "wander",
    },
    steam: "steam",
    colourways: {
      matcha: "matcha",
      sakura: "sakura",
      kinako: "kinako",
      yuzu: "yuzu",
      ramune: "ramune",
      budo: "budo",
    },
  },
  yue: {
    hint: "郁吓滑鼠等佢望你 · 撳一下戳佢 · 用下面按钮同佢玩",
    loading: "載入緊…",
    emotion: "表情",
    motion: "動作",
    colourway: "配色",
    stop: "停低",
    poke: "戳一下",
    say: "講啲咩？",
    sayPlaceholder: "揀一句等 AI Pet 講…",
    sayLoading: "AI Pet準備緊…",
    saySentencesExampleLabel: "下載語音包示例",
    saySentencesExampleLink: "/mochi/voice-pack-yue.zip",
    loadVoicePack: "載入本地語音包",
    clearVoicePack: "用返預設",
    voicePackLoaded: "已載入語音包",
    voicePackError: "讀唔到語音包",
    sayCustomPlaceholder: "打一句想佢講嘅嘢…",
    sayCustom: "發音",
    sayOr: "或者",
    saySentences: [
      { sentence: "你好吖！我係包仔～", audio: "/mochi/yue/01.wav" },
      { sentence: "早晨！今日都要開開心心㗎！", audio: "/mochi/yue/02.wav" },
      { sentence: "食咗飯未呀？", audio: "/mochi/yue/03.wav" },
      { sentence: "一齊去飲茶食點心啦！", audio: "/mochi/yue/04.wav" },
      { sentence: "今日天氣好好，出去行吓啦！", audio: "/mochi/yue/05.wav" },
      { sentence: "多謝晒你陪我傾偈！", audio: "/mochi/yue/06.wav" },
      { sentence: "拜拜，下次見！", audio: "/mochi/yue/07.wav" },
    ],
    poweredBy: "技術支援",
    ariaAvatar: "可以互動嘅 AI Pet 形象",
    emotions: {
      neutral: "平靜",
      happy: "開心",
      shy: "害羞",
      sad: "唔開心",
      angry: "嬲",
      surprised: "驚訝",
      thinking: "諗嘢",
      sleepy: "眼瞓",
    },
    motions: {
      nod: "點頭",
      sway: "擺動",
      hop: "跳吓",
      swing: "搖晃",
      turn: "轉身",
      wander: "行來行去",
    },
    steam: "冒蒸氣",
    colourways: {
      matcha: "抹茶",
      sakura: "櫻花",
      kinako: "黃豆粉",
      yuzu: "柚子",
      ramune: "波子汽水",
      budo: "提子",
    },
  },
};

export function MochiClient({ homepageName, ttsApiUrl }: MochiClientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarRef = useRef<DoughAvatar | null>(null);
  const rafRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingRef = useRef(false);
  const sayIdRef = useRef(0);
  const bubbleTimerRef = useRef<number | null>(null);
  const voicePackInputRef = useRef<HTMLInputElement | null>(null);
  const voicePackRef = useRef<VoicePack | null>(null);

  const [lang, setLang] = useState<Lang>("yue");
  const [pet, setPet] = useState<PetId>("bao");
  // Bumped per click so a repeat press restarts the steam animation from the start.
  const [steamKey, setSteamKey] = useState(0);
  const [steaming, setSteaming] = useState(false);
  const steamTimerRef = useRef<number | null>(null);
  const [emotion, setEmotion] = useState<Emotion>("happy");
  const [colourway, setColourway] = useState<ColourwayName>("matcha");
  const [ready, setReady] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const [sayLoading, setSayLoading] = useState(false);
  const [customSentence, setCustomSentence] = useState("");
  const [voicePack, setVoicePack] = useState<{ name: string; pack: VoicePack } | null>(null);
  const [voicePackError, setVoicePackError] = useState("");

  const t = COPY[lang];
  // A loaded pack replaces the built-in lines for every UI language until cleared.
  const saySentences = voicePack?.pack.lines ?? t.saySentences;

  const replaceVoicePack = useCallback((next: { name: string; pack: VoicePack } | null) => {
    voicePackRef.current?.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    voicePackRef.current = next?.pack ?? null;
    setVoicePack(next);
  }, []);

  useEffect(() => () => {
    voicePackRef.current?.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const onVoicePackFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;
    setVoicePackError("");
    try {
      const pack = await loadVoicePack(file);
      replaceVoicePack({ name: file.name, pack });
    } catch (err) {
      // DO NOT REMOVE THIS CONSOLE.LOG
      console.log("voice pack error", err);
      setVoicePackError(err instanceof Error ? err.message : String(err));
    }
  }, [replaceVoicePack]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const avatar = new DoughAvatar(ctx, {
      face: faceForPet(pet, colourway),
      size: "fit-canvas",
    });
    avatarRef.current = avatar;
    avatar.setEmotion({ emotion, intensity: 1 });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      avatar.resize(rect.width, rect.height, dpr);
    };

    resize();
    setReady(true);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const tick = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (speakingRef.current) {
        // The TTS audio is cross-origin, so the mouth is mimed rather than driven by an analyser.
        const syllable = Math.abs(Math.sin(now / 85));
        const phrase = 0.6 + 0.4 * Math.sin(now / 230);
        avatar.setMouthOpen(0.15 + 0.6 * syllable * phrase);
      }
      avatar.render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      audioRef.current?.pause();
      speakingRef.current = false;
      if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
      avatar.dispose();
      avatarRef.current = null;
      setReady(false);
    };
    // Intentionally mount once; emotion/colourway updates go through setters below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    avatarRef.current?.setEmotion({ emotion, intensity: 1 });
  }, [emotion]);

  useEffect(() => {
    avatarRef.current?.setFace(faceForPet(pet, colourway));
  }, [pet, colourway]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const avatar = avatarRef.current;
    const canvas = canvasRef.current;
    if (!avatar || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    avatar.lookAt(nx, ny);
  }, []);

  const onPointerLeave = useCallback(() => {
    avatarRef.current?.lookAt(0, 0);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const avatar = avatarRef.current;
    const canvas = canvasRef.current;
    if (!avatar || !canvas) return;
    // hitTest expects CSS pixels relative to the canvas, matching the silhouette.
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (avatar.hitTest(x, y)) {
      // Default impulse is negative (squash). Positive values expand instead.
      avatar.poke(-0.55);
    }
  }, []);

  const steam = useCallback(() => {
    avatarRef.current?.poke(-0.3);
    setSteamKey((k) => k + 1);
    setSteaming(true);
    if (steamTimerRef.current !== null) window.clearTimeout(steamTimerRef.current);
    steamTimerRef.current = window.setTimeout(() => setSteaming(false), STEAM_DURATION_MS);
  }, []);

  useEffect(() => {
    if (pet !== "bao") setSteaming(false);
  }, [pet]);

  useEffect(() => () => {
    if (steamTimerRef.current !== null) window.clearTimeout(steamTimerRef.current);
  }, []);

  const playMotion = useCallback((name: MotionName) => {
    const avatar = avatarRef.current;
    if (!avatar) return;
    if (name === "sway") {
      avatar.stopMotion();
    }
    avatar.playMotion(name);
  }, []);

  const stopSpeaking = useCallback(() => {
    speakingRef.current = false;
    const avatar = avatarRef.current;
    avatar?.setMouthOpen(0);
    avatar?.setSpeaking(false);
  }, []);

  const hideBubbleLater = useCallback((ms: number) => {
    if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = window.setTimeout(() => setBubbleText(""), ms);
  }, []);

  const fetchTtsAudio = useCallback(async (text: string) => {
    const res = await fetch(ttsApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`tts ${res.status}`);
    const data = (await res.json()) as { audio_url?: string };
    if (!data.audio_url) throw new Error("no audio_url");
    return data.audio_url;
  }, [ttsApiUrl]);

  const say = useCallback(async ({ sentence, audio: clip, emotion: lineEmotion }: SayLine) => {
    const id = ++sayIdRef.current;
    audioRef.current?.pause();
    stopSpeaking();
    if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
    setBubbleText(sentence);
    setSayLoading(true);

    // Apply the line's emotion before audio starts, so her face matches what she says.
    if (lineEmotion && (EMOTIONS as readonly string[]).includes(lineEmotion)) {
      setEmotion(lineEmotion as Emotion);
    }

    try {
      const audioUrl = clip.trim() || (await fetchTtsAudio(sentence));
      // A newer line was picked while this one was loading.
      if (id !== sayIdRef.current) return;

      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;
      audio.src = audioUrl;
      audio.onplaying = () => {
        speakingRef.current = true;
        avatarRef.current?.setSpeaking(true);
      };
      const finish = () => {
        stopSpeaking();
        hideBubbleLater(BUBBLE_LINGER_MS);
      };
      audio.onended = finish;
      audio.onerror = finish;
      await audio.play();
    } catch (err) {
      // DO NOT REMOVE THIS CONSOLE.LOG
      console.log("mochi tts error", err);
      if (id === sayIdRef.current) {
        stopSpeaking();
        hideBubbleLater(BUBBLE_LINGER_MS);
      }
    } finally {
      if (id === sayIdRef.current) setSayLoading(false);
    }
  }, [fetchTtsAudio, stopSpeaking, hideBubbleLater]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header homepageName={homepageName} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-wrap justify-end items-center gap-2">
            <label className="sr-only" htmlFor="pet-select">
              Pet
            </label>
            <select
              id="pet-select"
              value={pet}
              onChange={(e) => setPet(e.target.value as PetId)}
              className="h-8 rounded-md border border-border bg-card px-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              {PET_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border p-1 bg-card">
              {LANG_OPTIONS.map((opt) => (
                <Button
                  key={opt.id}
                  type="button"
                  size="sm"
                  variant={lang === opt.id ? "default" : "ghost"}
                  onClick={() => setLang(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {PET_OPTIONS.find((opt) => opt.id === pet)?.label ?? pet}
            </h1>
            <p className="text-muted-foreground">{t.hint}</p>
          </div>

          <div className="rounded-2xl border border-border bg-gradient-to-b from-emerald-50/80 to-background dark:from-emerald-950/30 dark:to-background p-4 sm:p-6">
            <div className="relative mx-auto w-full max-w-md">
              <canvas
                ref={canvasRef}
                className="block w-full aspect-square touch-none cursor-pointer"
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
                onPointerDown={onPointerDown}
                aria-label={t.ariaAvatar}
              />
              {steaming ? (
                <svg
                  key={steamKey}
                  aria-hidden
                  viewBox="0 0 120 120"
                  className="pointer-events-none absolute w-[28%]"
                  style={{
                    left: `${STEAM_ANCHOR.x * 100}%`,
                    top: `${STEAM_ANCHOR.y * 100}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.75)"
                  strokeWidth={6}
                  strokeLinecap="round"
                >
                  {[30, 60, 90].map((x, i) => (
                    <path
                      key={x}
                      className="bao-steam-wisp"
                      style={{ animationDelay: `${i * 0.35}s` }}
                      d={`M${x} 115 C${x - 12} 95 ${x + 12} 80 ${x} 60 C${x - 12} 40 ${x + 12} 25 ${x} 8`}
                    />
                  ))}
                </svg>
              ) : null}
              {bubbleText ? (
                <div
                  className="pointer-events-none absolute"
                  style={{ left: `${BUBBLE_ANCHOR.x * 100}%`, top: `${BUBBLE_ANCHOR.y * 100}%` }}
                >
                  {/* -left-8 and bottom-3 put the tail tip on the anchor point. */}
                  <div
                    role="status"
                    aria-live="polite"
                    className="absolute -left-8 bottom-3 w-max max-w-[min(16rem,60vw)] rounded-2xl border border-border bg-card px-4 py-2 text-sm sm:text-base text-foreground shadow-md animate-in fade-in zoom-in-95 origin-bottom-left"
                  >
                    <span className="relative z-10">{bubbleText}</span>
                    <span
                      aria-hidden
                      className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b border-r border-border bg-card"
                    />
                  </div>
                </div>
              ) : null}
            </div>
            {!ready ? (
              <p className="text-center text-sm text-muted-foreground mt-2">{t.loading}</p>
            ) : null}
          </div>
          {/* 讲话、表情、动作、配色 */}
          {/* 讲点咩，下拉框里是备选的句子，在选中后，由 mochi 讲出来，mochi 右上方出现说话气泡，说话框里显示选中的句子 */}
          <div className="space-y-4">
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">{t.say}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value=""
                  disabled={sayLoading}
                  onChange={(e) => {
                    const line = saySentences[Number(e.target.value)];
                    if (e.target.value && line) void say(line);
                  }}
                  className="w-full sm:w-auto min-w-64 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
                >
                  <option value="">{sayLoading ? t.sayLoading : t.sayPlaceholder}</option>
                  {saySentences.map((line, i) => {
                    const emotionLabel =
                      line.emotion && (EMOTIONS as readonly string[]).includes(line.emotion)
                        ? t.emotions[line.emotion as Emotion]
                        : "";
                    return (
                      <option key={`${voicePack?.name ?? lang}-${i}`} value={i}>
                        {emotionLabel ? `${line.sentence}（${emotionLabel}）` : line.sentence}
                      </option>
                    );
                  })}
                </select>
                <Button asChild size="sm" variant="outline">
                  <a href={t.saySentencesExampleLink} download>
                    <Download />
                    {t.saySentencesExampleLabel}
                  </a>
                </Button>
                {/* 加载本地语音包：zip 内含 say-sentences.csv 和对应的音频文件 */}
                <input
                  ref={voicePackInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={onVoicePackFile}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => voicePackInputRef.current?.click()}
                >
                  <FolderOpen />
                  {t.loadVoicePack}
                </Button>
              </div>
              {voicePack ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  {t.voicePackLoaded}: {voicePack.name}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => replaceVoicePack(null)}
                  >
                    <X />
                    {t.clearVoicePack}
                  </Button>
                </p>
              ) : null}
              {voicePackError ? (
                <p className="text-xs text-destructive">
                  {t.voicePackError}: {voicePackError}
                </p>
              ) : null}
            {/* Input box for any sentence, plus a button that pronounces it. */}
            <h2 className="text-sm font-medium text-muted-foreground">{t.sayOr}</h2>
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const sentence = customSentence.trim();
                if (!sentence || sayLoading) return;
                void say({ sentence, audio: "" });
              }}
            >
              <input
                type="text"
                value={customSentence}
                disabled={sayLoading}
                placeholder={t.sayCustomPlaceholder}
                onChange={(e) => setCustomSentence(e.target.value)}
                className="w-full sm:w-auto min-w-64 flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={sayLoading || !customSentence.trim()}
              >
                {t.sayCustom}
              </Button>
            </form>
            </section>

            {/* 表情 */}
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">{t.emotion}</h2>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((name) => (
                  <Button
                    key={name}
                    type="button"
                    size="sm"
                    variant={emotion === name ? "default" : "outline"}
                    onClick={() => setEmotion(name)}
                  >
                    {t.emotions[name]}
                  </Button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">{t.motion}</h2>
              <div className="flex flex-wrap gap-2">
                {MOTIONS.map((name) => (
                  <Button
                    key={name}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => playMotion(name)}
                  >
                    {t.motions[name]}
                  </Button>
                ))}
                {pet === "bao" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={steam}
                    className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/50"
                  >
                    {t.steam}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => avatarRef.current?.stopMotion()}
                >
                  {t.stop}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => avatarRef.current?.poke(-0.7)}
                >
                  {t.poke}
                </Button>
              </div>
            </section>

            {pet === "mochi" ? (
              <section className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">{t.colourway}</h2>
                <div className="flex flex-wrap gap-2">
                  {COLOURWAYS.map((name) => (
                    <Button
                      key={name}
                      type="button"
                      size="sm"
                      variant={colourway === name ? "default" : "outline"}
                      onClick={() => setColourway(name)}
                    >
                      {t.colourways[name]}
                    </Button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t.poweredBy}{" "}
            <a
              href="https://github.com/NonceGeek/mochi"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              mochi-avatar
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
