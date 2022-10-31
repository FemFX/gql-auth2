import {
  Args,
  CONTEXT,
  Context,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { compare, hash } from "bcryptjs";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { sign } from "jsonwebtoken";
import { MyContext } from "src/types/MyContext";
import { createAccessToken, createRefreshToken } from "src/utils/auth";
import { AuthGuard } from "./auth.guard";
import { redis } from "src/redis";
import { sendRefreshToken } from "src/utils/sendRefreshToken";

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;
  @Field(() => User)
  user: User;
}

@Resolver()
export class UserResolver {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>
  ) {}
  @UseGuards(AuthGuard)
  @Query(() => User, { nullable: true })
  async me(@Context() { req }: MyContext): Promise<User> {
    return await this.userRepository.findOne({ where: { id: +req.userId } });
  }
  @Query(() => String)
  async hello(@Context() ctx: MyContext) {
    return `hello`;
  }
  @Query(() => String)
  @UseGuards(AuthGuard)
  async bye(@Context() { req }: MyContext) {
    return `bye ${req.userId}`;
  }
  @Query(() => [User])
  async users(): Promise<User[]> {
    return await this.userRepository.find();
  }
  @Mutation(() => Boolean)
  async register(
    @Args("email", { type: () => String }) email: string,
    @Args("password", { type: () => String }) password: string
  ): Promise<boolean> {
    const hashedPass = await hash(password, 12);
    try {
      await this.userRepository.create({ email, password: hashedPass }).save();
    } catch (err) {
      console.log(err);
      return false;
    }
    return true;
  }
  @Mutation(() => LoginResponse)
  async login(
    @Args("email", { type: () => String }) email: string,
    @Args("password", { type: () => String }) password: string,
    @Context() { req, res }: MyContext
  ): Promise<LoginResponse> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new Error("could not find user");
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      throw new Error("bad password");
    }
    req.userId = user.id;
    sendRefreshToken(res, createRefreshToken(user));
    return {
      accessToken: createAccessToken(user),
      user,
    };
  }
  @Mutation(() => Boolean)
  async logout(@Context() { res }: MyContext) {
    res.clearCookie("jid");
    return true;
  }
}
