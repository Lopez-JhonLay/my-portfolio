import { Router, type Response } from "express";

type HealthResponse = {
  status: "ok";
};

export const healthRouter = Router();

healthRouter.get("/", (_request, response: Response<HealthResponse>) => {
  response.set("Cache-Control", "no-store").status(200).json({ status: "ok" });
});
