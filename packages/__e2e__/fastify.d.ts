import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    isRunning: boolean;
  }
}
