import { getBrawlerPortraitById } from "./cdn.js";
import { getBrawlerPin } from "./brawlerPins.js";

export function getBrawlerImage(brawler) {
  if (!brawler) return getBrawlerPin("");
  // Prefer official id-based portrait if available
  const id = brawler.id ?? brawler.brawlerId ?? brawler?.brawler?.id;
  if (id) {
    const p = getBrawlerPortraitById(id);
    if (p) return p;
  }
  const name = brawler.name ?? brawler?.brawler?.name;
  return getBrawlerPin(name);
}
