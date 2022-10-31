import { sign } from "jsonwebtoken";
import { User } from "src/user/user.entity";

export const createAccessToken = (user: User) => {
  return sign({ userId: user.id }, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
};
export const createRefreshToken = (user: User) => {
  return sign({ userId: user.id }, process.env.REFRESH_SECRET, {
    expiresIn: "30d",
  });
};
