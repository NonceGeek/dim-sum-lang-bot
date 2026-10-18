import { getReadmeConfig } from "@/lib/readme-config";
import { MochiClient } from "@/app/pet/mochi-client";

export default function MochiPage() {
  const config = getReadmeConfig();
  return (
    <MochiClient
      homepageName={config.homepageName}
      ttsApiUrl={config.chatApiUrl.replace(/\/[^/]*$/, "/tts_cantonese")}
    />
  );
}
