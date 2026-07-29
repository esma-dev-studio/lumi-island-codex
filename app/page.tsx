import type { Metadata } from "next";
import { LumiIslandApp } from "@/src/ui/LumiIslandApp";

export const metadata: Metadata = {
  title: "Lumi Island — ひかりを集める島暮らし",
  description:
    "探索、採取、クラフト、家具づくり、住民のおねがいを楽しむオリジナル3Dスローライフゲーム。",
};

export default function Home() {
  return <LumiIslandApp />;
}
