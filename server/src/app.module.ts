import { ApolloDriverConfig } from "@nestjs/apollo";
import { ApolloDriver } from "@nestjs/apollo/dist/drivers";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { User } from "./user/user.entity";
import { UserModule } from "./user/user.module";
import { UserResolver } from "./user/user.resolver";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "root",
      password: "",
      database: "gql-auth",
      synchronize: true,
      logging: true,
      entities: [User],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      include: [UserModule],
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: true,
      context: ({ req, res }) => ({ req, res }),
      cors: false,
    }),
    TypeOrmModule.forFeature([User]),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
