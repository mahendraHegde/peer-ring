import { type LoggerOptType } from "../types";
import { type Logger, pino } from "pino";

export const buildLogger = (
  loggerInstanceOrOpts?: LoggerOptType,
  bindings?: pino.Bindings,
): Logger => {
  const createChildIfBindings = (instance: Logger): Logger => {
    if (bindings) {
      return instance.child(bindings);
    }
    return instance;
  };
  if (!loggerInstanceOrOpts) {
    return createChildIfBindings(pino({ level: "info" }));
  } else if ("child" in loggerInstanceOrOpts) {
    // logger instance is provided
    return createChildIfBindings(loggerInstanceOrOpts);
  }
  // logger opts provided
  return createChildIfBindings(pino(loggerInstanceOrOpts));
};
