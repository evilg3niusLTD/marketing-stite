import { unstable_noStore as noStore } from "next/cache";
import { ChatWidget } from "@/components/chat-widget";
import { runtimeEnv } from "@/lib/chat";

export function ChatGate() {
  noStore();
  if (!runtimeEnv("BEDROCK_REGION")) return null;
  return <ChatWidget />;
}
