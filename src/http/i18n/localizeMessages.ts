import type { RequestHandler, Response } from "express";
import { DEFAULT_LOCALE, negotiateLocale, type Locale } from "./locales";
import { translateMessage } from "./translateMessage";

const hasMessage = (body: unknown): body is { message: string } =>
    typeof body === "object" && body !== null && typeof (body as { message?: unknown }).message === "string";

/** Every JSON body is an envelope: only its message is translated, the data is left as it is. */
const localizeBody = (body: unknown, locale: Locale): unknown => {
    if (locale === DEFAULT_LOCALE || !hasMessage(body)) {
        return body;
    }
    return { ...body, message: translateMessage(body.message, locale) };
};

/**
 * Answers in the language of the Accept-Language header. Must run before the routes,
 * because it wraps res.json. Sets Content-Language to the language used.
 */
export const localizeMessages: RequestHandler = (req, res, next) => {
    const locale = negotiateLocale(req.get("accept-language"));
    res.setHeader("Content-Language", locale);
    const sendJson = res.json.bind(res);
    res.json = ((body: unknown) => sendJson(localizeBody(body, locale))) as Response["json"];
    next();
};
