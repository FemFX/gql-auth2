import { Request, Response } from "express";

export interface MyContext {
  req: Request & { userId: any };
  res: Response;
}
