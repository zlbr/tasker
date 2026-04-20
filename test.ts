import { detectMissingEntities } from "./lib/prompt";

console.log(
  detectMissingEntities("What's on my calendar for friday?", "calendar"),
);
