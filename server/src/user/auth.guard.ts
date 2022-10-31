import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { verify } from "jsonwebtoken";
import { redis } from "src/redis";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context).getContext();
    try {
      const header = ctx.req.headers.authorization;
      if (!header) {
        throw new Error("not authenticated");
      }
      const bearer = header.split(" ")[0];
      const token = header.split(" ")[1];
      if (bearer !== "bearer" || !token) {
        throw new Error("not authenticated");
      }
      const payload: any = verify(token, process.env.ACCESS_SECRET);
      ctx.req.userId = payload.userId;
      // await redis.set("userId", payload.userId);
      return true;
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }
}
