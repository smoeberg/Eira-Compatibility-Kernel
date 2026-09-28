import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { OidcService } from "./oidc.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly oidc: OidcService) {}

  @Get("login")
  login(
    @Req() request: Request,
    @Res() response: Response,
    @Query("return") returnTo?: string,
  ): void {
    const target = this.oidc.beginLogin(request, returnTo ?? "/");
    response.redirect(target);
  }

  @Get("callback")
  async callback(
    @Req() request: Request,
    @Res() response: Response,
    @Query("code") code?: string,
    @Query("state") state?: string,
    @Query("error") error?: string,
  ): Promise<void> {
    if (error) {
      throw new UnauthorizedException(`OIDC error: ${error}`);
    }
    const returnTo = await this.oidc.finishCallback(
      request,
      code ?? "",
      state ?? "",
    );
    response.redirect(returnTo);
  }

  @Get("logout")
  logout(@Req() request: Request, @Res() response: Response): void {
    request.session.destroy(() => undefined);
    if (this.oidc.isEnabled()) {
      response.redirect(this.oidc.logoutUrl());
      return;
    }
    response.redirect("/");
  }

  @Get("me")
  me(@Req() request: Request) {
    const user = this.oidc.sessionUser(request);
    return {
      authenticated: Boolean(user?.sub),
      user: user
        ? {
            sub: user.sub,
            email: user.email ?? null,
            name: user.name ?? null,
          }
        : null,
    };
  }
}
