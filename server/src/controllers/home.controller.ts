import type { RequestHandler } from "express";

import { getHomeOverview } from "../services/home.service.js";

export const getHomeDashboard: RequestHandler = async (_req, res) => {
  const overview = await getHomeOverview();

  res.json({
    success: true,
    data: overview,
  });
};
