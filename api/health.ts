import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json({
    status: "ok",
    hasServerKey: !!process.env.GEMINI_API_KEY,
    appName: "Physics AI-Lab 10",
    version: "2.0.0",
  });
}
