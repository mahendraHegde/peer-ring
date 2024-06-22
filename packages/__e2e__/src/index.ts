import { KVStore } from "@peer-ring/kv-store";
import Fastify from "fastify";
import { initKV } from "./kv";

const fastify = Fastify({
  logger: true,
  disableRequestLogging: true,
});
const watchQueryParams = { labelSelector: `app=kv-app` };
const kv = new KVStore({
  enableDataSync: true,
  peerRingOpts: {
    peerDiscovery: {
      watchQueryParams,
    },
    netManager: {
      port: 4445,
    },
  },
  logger: {
    level: "warn",
  },
});

fastify.addHook("onClose", async () => {
  await kv.stop();
});

const gracefulExit = async () => {
  if (fastify.isRunning) {
    await fastify.close();
  }
  process.exit(0);
};

process.on("SIGTERM", () => {
  void gracefulExit();
});
process.on("SIGINT", () => {
  void gracefulExit();
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1); // Exit the process
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1); // Exit the process
});

const PORT = process.env.PORT;
const inite2e = async (): Promise<void> => {
  console.log("init");
  await kv.init();
  console.log("kv init");

  await initKV(fastify, kv);
  fastify.setErrorHandler((err) => {
    fastify.log.error({ err }, `Error occurred!!!`);
  });
  fastify.decorate("isRunning", false);
  fastify.listen({ port: +(PORT ?? 4444), host: "0.0.0.0" }, function (err) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify["isRunning"] = true;
    console.log(`server started at port ${PORT}`);
  });
};

inite2e().catch((err) => {
  console.log(err);
});
