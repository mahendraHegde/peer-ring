import { type KVStore } from "@peer-ring/kv-store";
import { type FastifyInstance } from "fastify";

type Query = { replicationFactor?: number; quorumCount?: number };

export const initKV = async (
  fastify: FastifyInstance,
  kv: KVStore,
): Promise<void> => {
  fastify.post<{ Body: { key: string; value: string }; Querystring: Query }>(
    "/kv",
    async function (request, reply) {
      await kv.set(request.body.key, request.body.value, request.query);
      await reply.status(201).send({});
    },
  );

  fastify.get<{ Params: { key: string }; Querystring: Query }>(
    "/kv/:key",
    async function (request, reply) {
      await reply.send(await kv.get(request.params.key, request.query));
    },
  );
  fastify.delete<{ Params: { key: string }; Querystring: Query }>(
    "/kv/:key",
    async function (request, reply) {
      await reply.send(await kv.delete(request.params.key, request.query));
    },
  );
};
