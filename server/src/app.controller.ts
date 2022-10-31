import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { verify } from "jsonwebtoken";
import { Repository } from "typeorm";
import { AppService } from "./app.service";
import { User } from "./user/user.entity";
import { createAccessToken, createRefreshToken } from "./utils/auth";
import { sendRefreshToken } from "./utils/sendRefreshToken";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Post("refresh_token")
  async refreshToken(@Req() req, @Res() res) {
    const token = req.cookies.jid;
    if (!token) {
      return res.send({ ok: false, accessToken: "" });
    }
    let payload = null;
    try {
      payload = verify(token, process.env.REFRESH_SECRET);
    } catch (err) {
      console.log(err);
      return res.send({ ok: false, accessToken: "" });
    }
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
    });
    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }
    sendRefreshToken(res, createRefreshToken(user));

    return res.send({ ok: true, accessToken: createAccessToken(user) });
  }
}
