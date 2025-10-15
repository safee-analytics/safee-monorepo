import type { Request, Response, NextFunction } from "express";
import { parseAcceptLanguage, isValidLocale, type Locale } from "@safee/database";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      locale: Locale;
    }
  }
}

export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  let locale: Locale = "en";

  const queryLocale = req.query.locale as string | undefined;
  if (queryLocale && isValidLocale(queryLocale)) {
    locale = queryLocale;
  } else {
    const headerLocale = req.headers["x-locale"] as string | undefined;
    if (headerLocale && isValidLocale(headerLocale)) {
      locale = headerLocale;
    } else {
      const acceptLanguage = req.headers["accept-language"];
      locale = parseAcceptLanguage(acceptLanguage);
    }
  }

  req.locale = locale;
  next();
}
