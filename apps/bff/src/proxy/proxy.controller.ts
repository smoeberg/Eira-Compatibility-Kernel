import { All, Controller, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ProxyService } from "./proxy.service";

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @All("api/*path")
  async proxyApi(@Req() request: Request, @Res() response: Response) {
    await this.proxy.forward(request, response);
  }
}
