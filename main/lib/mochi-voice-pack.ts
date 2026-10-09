export type VoicePackLine = { sentence: string; audio: string };

export type VoicePack = {
  lines: VoicePackLine[];
  /** Blob URLs created for the pack's audio; revoke them when the pack is replaced. */
  objectUrls: string[];
};

const MANIFEST_NAME = "say-sentences.json";

const AUDIO_MIME: Record<string, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  webm: "audio/webm",
};

const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/**
 * Minimal zip reader for voice packs: stored and deflated entries, no zip64 or
 * encryption. Deflate goes through the browser's native DecompressionStream.
 */
async function unzip(buffer: ArrayBuffer): Promise<Record<string, Uint8Array<ArrayBuffer>>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();

  // The end-of-central-directory record sits in the last 22 bytes plus an optional comment.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip file");

  const count = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const entries: Record<string, Uint8Array<ArrayBuffer>> = {};

  for (let n = 0; n < count; n++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) throw new Error("corrupt zip directory");
    const method = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const name = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith("/")) continue;

    // The local header repeats name/extra with its own lengths, so re-read them there.
    const dataStart =
      localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
    const data = bytes.slice(dataStart, dataStart + compressedSize);

    if (method === 0) {
      entries[name] = data;
    } else if (method === 8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      entries[name] = new Uint8Array(await new Response(stream).arrayBuffer());
    } else {
      throw new Error(`unsupported zip compression (${method}) for ${name}`);
    }
  }

  return entries;
}

/**
 * Find the zip entry an `audio` path refers to. Paths are relative to the folder
 * holding `say-sentences.json`, e.g. `./sentences-voice/thx.wav`, so the pack works
 * the same whether it is unzipped on disk or loaded here.
 */
function resolvePackPath(manifestName: string, audio: string): string {
  const baseDir = manifestName.includes("/") ? manifestName.slice(0, manifestName.lastIndexOf("/")) : "";
  const parts: string[] = [];
  for (const segment of `${baseDir}/${audio}`.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") parts.pop();
    else parts.push(segment);
  }
  return parts.join("/");
}

/**
 * Read a voice pack zip: `say-sentences.json` (`{ saySentences: [{ sentence, audio }] }`)
 * plus the audio files it references. Remote `audio` URLs are kept as-is, and an
 * empty `audio` still falls back to TTS.
 */
export async function loadVoicePack(file: File): Promise<VoicePack> {
  const entries = await unzip(await file.arrayBuffer());
  const names = Object.keys(entries);

  // The shallowest manifest wins, so a pack zipped with or without its top folder both work.
  const manifestName = names
    .filter((name) => basename(name) === MANIFEST_NAME)
    .sort((a, b) => a.split("/").length - b.split("/").length)[0];
  if (!manifestName) throw new Error(`missing ${MANIFEST_NAME}`);

  const manifest = JSON.parse(new TextDecoder().decode(entries[manifestName])) as {
    saySentences?: unknown;
  };
  if (!Array.isArray(manifest.saySentences)) throw new Error("saySentences is not an array");

  const objectUrls: string[] = [];
  const lines: VoicePackLine[] = [];

  for (const item of manifest.saySentences) {
    const sentence = typeof item?.sentence === "string" ? item.sentence.trim() : "";
    if (!sentence) continue;
    const audio = typeof item?.audio === "string" ? item.audio.trim() : "";

    if (!audio || /^(https?:|blob:|data:)/.test(audio)) {
      lines.push({ sentence, audio });
      continue;
    }

    const entry = resolvePackPath(manifestName, audio);
    if (!entries[entry]) throw new Error(`audio not found in pack: ${audio}`);
    const ext = entry.slice(entry.lastIndexOf(".") + 1).toLowerCase();
    const url = URL.createObjectURL(
      new Blob([entries[entry]], { type: AUDIO_MIME[ext] ?? "application/octet-stream" }),
    );
    objectUrls.push(url);
    lines.push({ sentence, audio: url });
  }

  if (lines.length === 0) {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    throw new Error("saySentences has no usable lines");
  }

  return { lines, objectUrls };
}
