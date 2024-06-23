import grpc, {
  type ClientDuplexStream,
  Server,
  ServerCredentials,
  type ServerDuplexStream,
  credentials,
  ServiceError,
  Metadata,
  status as grpcStatus,
} from "@grpc/grpc-js";
import {
  HashRingClient,
  HashRingService,
  type IHashRingServer,
} from "./proto/hashring_grpc_pb";
import { nanoid } from "nanoid";
import {
  type InetManager,
  PredefinedCommandsEnum,
  type Command,
  type NetManagerOpts,
} from "../types";
import { StreamCommand, ErrorResponse, PeerPayload } from "./proto/hashring_pb";
import { type pino } from "pino";
import { buildLogger } from "../helpers/logger";

type PendingRequestValue = {
  resolve: (value: Command | PromiseLike<Command>) => void;
  reject: (err: ErrorResponse.AsObject) => void;
  startedAt: number;
};

type DuplexStream =
  | ServerDuplexStream<PeerPayload, PeerPayload>
  | ClientDuplexStream<PeerPayload, PeerPayload>;
export class RpcNetManager implements InetManager {
  executeCallback: (
    command: Command,
  ) => Promise<Command | undefined> | Command | undefined;
  executeStreamCallback: (command: Command) => AsyncGenerator<Command>;

  ip: string;
  logger: pino.Logger;
  pendinRequests = new Map<string, PendingRequestValue>();
  timeoutRef?: NodeJS.Timeout;
  connections: Map<string, DuplexStream> = new Map<string, DuplexStream>();
  server: Server;
  constructor(private readonly opts: NetManagerOpts) {
    this.opts = {
      ...this.opts,
      port: this.opts.port ?? 4444,
      requestTimeout: this.opts.requestTimeout ?? 2000,
    };
    this.logger = buildLogger(opts.logger, { class: RpcNetManager.name });
    this.server = new Server();
    this.server.addService(HashRingService, this.getService());
  }

  private setupRequestCleaner = (): void => {
    if (this.timeoutRef) {
      //already timer has setup, dont create one more
      return;
    }
    const timeout = this.opts.requestTimeout ?? 2000;

    const cleanupPendingRequests = (): void => {
      const currentTime = Date.now();

      //@TODO improve for large pending requests array
      for (const [mid, pendingRequest] of this.pendinRequests.entries()) {
        const elapsedTime = currentTime - pendingRequest.startedAt;
        if (elapsedTime > timeout) {
          const metadata = new Metadata();
          metadata.set("mid", mid);
          const serviceError = new ErrorResponse();
          serviceError.setCode(String(grpcStatus.ABORTED));
          serviceError.setMessage(`Request did not finish within ${timeout}ms`);
          this.logger.warn({ serviceError }, `request aborted due to timeout`);
          pendingRequest.reject(serviceError.toObject());
          this.pendinRequests.delete(mid);
        }
      }
      if (!this.pendinRequests.size) {
        //dont setup cleanup unless there's a pending request
        this.timeoutRef = undefined;
      } else {
        // Reschedule the cleanup function
        this.timeoutRef = setTimeout(cleanupPendingRequests, timeout);
      }
    };

    // Schedule the initial cleanup function
    this.timeoutRef = setTimeout(cleanupPendingRequests, timeout);
  };

  async start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.server.bindAsync(
        `0.0.0.0:${this.opts.port}`,
        ServerCredentials.createInsecure(),
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          this.logger.debug(`GRPC started on port${this.opts.port}`);
          this.setupRequestCleaner();
          resolve();
        },
      );
    });
  }

  private serializeCommand({
    command,
    error,
    mid,
  }: {
    command?: Command;
    error?: Error & { code?: string };
    mid?: string;
  }): PeerPayload {
    mid = mid ?? nanoid();
    const response = new PeerPayload();
    response.setIp(this.ip);
    response.setId(mid);
    response;
    if (command) {
      const streamCommand = new StreamCommand();
      streamCommand.setCommand(command.command);
      streamCommand.setKey(command.key);
      streamCommand.setNamespace(command.namespace);
      if (command.payload)
        streamCommand.setPayload(JSON.stringify(command.payload));
      response.setCommand(streamCommand);
    }
    if (error) {
      const err = new ErrorResponse();
      err.setCode(error.code || String(grpcStatus.INTERNAL));
      err.setMessage(error.message);
      response.setError(err);
    }
    return response;
  }

  private deSerializeCommand(streamCommand: StreamCommand): Command {
    const payload = streamCommand.getPayload();
    const command: Command = {
      command: streamCommand.getCommand(),
      key: streamCommand.getKey(),
      namespace: streamCommand.getNamespace(),
      payload: payload ? JSON.parse(payload) : undefined,
    };
    this.logger.debug(
      { command, streamCommand: streamCommand },
      `Command deserialized`,
    );
    return command;
  }

  private async onIncomingData(
    peerPayload: PeerPayload,
    call: DuplexStream,
  ): Promise<void> {
    const mid = peerPayload.getId();
    const { resolve, reject } = this.pendinRequests.get(mid) || {};
    const streamCommand = peerPayload.hasCommand()
      ? peerPayload.getCommand()
      : undefined;
    if (resolve && reject) {
      const error = peerPayload.hasError() ? peerPayload.getError() : undefined;
      if (error) {
        reject(error.toObject());
        return;
      }
      if (streamCommand) {
        const command = this.deSerializeCommand(streamCommand);
        this.logger.debug(
          { peerPayload, command, method: "onRequest" },
          `response from peer`,
        );
        // this is a response, so resolve it
        resolve(command);
        this.pendinRequests.delete(mid);
        return;
      }
    }
    if (!streamCommand) {
      this.logger.warn(
        { peerPayload, method: "onRequest" },
        `response from peer without error or command`,
      );
      return;
    }
    const command = this.deSerializeCommand(streamCommand);

    this.logger.debug({ command, method: "onRequest" }, `request from peer`);

    let response;
    let error;
    try {
      response = await this.executeCallback(command);
    } catch (err) {
      error = err;
      this.logger.warn(
        { err, command },
        `error occurred sending error response back to the peer`,
      );
    }

    const cmd =
      response || error
        ? this.serializeCommand({ command: response, mid })
        : this.serializeCommand({
            command: { ...command, command: PredefinedCommandsEnum.EmptyReply },
            mid,
          });
    try {
      await this.writeDataWithBackpressure(call, cmd);
    } catch (err) {
      //erro while sending response, so ignore
      this.logger.error(
        { command: cmd, err, method: "onRequest" },
        `Failed to send resonse back to the peer`,
      );
    }
  }

  private registerCloseHandler(call: DuplexStream): void {
    const handleConClose = (): void => {
      for (const key of this.connections.keys()) {
        if (this.connections.get(key) === call) {
          this.connections.delete(key);
        }
      }
    };
    call.once("end", handleConClose);
    call.once("close", handleConClose);
    call.once("error", handleConClose);
  }

  private async writeDataWithBackpressure(
    call: DuplexStream | grpc.ServerWritableStream<PeerPayload, PeerPayload>,
    payload: PeerPayload,
  ): Promise<void> {
    function waitForDrain() {
      return new Promise((resolve) => {
        call.once("drain", resolve);
      });
    }
    if (call.writableNeedDrain) {
      this.logger.debug(
        { payload },
        `reached highWaterMark. waiting to drain...`,
      );
      await waitForDrain();
      this.logger.debug({ payload }, `stream drain success`);
    }

    return new Promise((resolve, reject) => {
      call.write(payload, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  private getService(): IHashRingServer {
    const connections = this.connections;
    const onData = this.onIncomingData.bind(this) as typeof this.onIncomingData;
    const logger = this.logger;
    const closeHandler = this.registerCloseHandler.bind(this);
    const HashRingServer: IHashRingServer = {
      executeCommand: function (
        call: ServerDuplexStream<PeerPayload, PeerPayload>,
      ): void {
        call.on("data", (message: PeerPayload) => {
          const ip = message.getIp();
          const exisitng = connections.get(ip);
          if (exisitng) {
            //avoid duplicate connections
            if (exisitng !== call) {
              exisitng.end();
              connections.set(ip, call);
              logger.debug(
                { connections: Array.from(connections.keys()) },
                `added a new connection to set`,
              );
            }
          } else {
            connections.set(ip, call);
            logger.debug(
              { connections: Array.from(connections.keys()) },
              `added a new connection to set`,
            );
          }
          void onData(message, call);
        });
        closeHandler(call);
      },
      executeServerStreamCommand: async (
        call: grpc.ServerWritableStream<PeerPayload, PeerPayload>,
      ): Promise<void> => {
        const command = call.request.getCommand();
        if (!command) {
          call.end();
          return;
        }
        const cmd = this.deSerializeCommand(command);
        const generator = this.executeStreamCallback(cmd);
        try {
          for await (let data of generator) {
            await this.writeDataWithBackpressure(
              call,
              this.serializeCommand({ command: data }),
            );
          }
        } catch (err) {
          this.logger.error(
            { err, cmd },
            `error occurrend while executing stream callback`,
          );
          call.emit("error", err);
        } finally {
          call.end();
        }
      },
    };
    return HashRingServer;
  }

  async *getDataStream<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(ip: string, command: Command): AsyncGenerator<Command<T>> {
    const client = new HashRingClient(
      `${ip}:${this.opts.port}`,
      credentials.createInsecure(),
    );
    const call = client.executeServerStreamCommand(
      this.serializeCommand({ command }),
    );
    call.once("error", (err) => {
      this.logger.error(
        { err, command, ip },
        `Failed to fetch data stream from peer`,
      );
    });
    for await (const chunk of call) {
      const data = chunk as PeerPayload;
      const command = data.getCommand();
      if (command) {
        yield this.deSerializeCommand(command) as Command<T>;
      }
    }
  }

  async makeRequest<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(ip: string, command: Command): Promise<Command<T>> {
    return new Promise<Command<T>>((resolve, reject) => {
      const conn = this.connections.get(ip);
      if (!conn || conn.destroyed || conn.closed) {
        // establish connection
        this.logger.debug(
          { ip, command, method: "sendMessage" },
          `establishing new connection to peer`,
        );
        const client = new HashRingClient(
          `${ip}:${this.opts.port}`,
          credentials.createInsecure(),
        );
        const deadline = new Date();
        deadline.setMinutes(deadline.getMinutes() + 30);
        const call = client.executeCommand({ deadline });
        this.connections.set(ip, call);

        this.logger.debug(
          { connections: Array.from(this.connections.keys()) },
          `added a new connection to set from sendMessage`,
        );
        call.on("data", (data: PeerPayload) => {
          void this.onIncomingData(data, call);
        });
        call.once("error", (error) => {
          const err = error as ServiceError | Error;
          if ("code" in err && err.code === grpcStatus.UNAVAILABLE) {
            //connection error
            // Reject all pending requests related to this connection
            this.logger.error(
              { ip, command, method: "sendMessage", err },
              `Connection error`,
            );
            for (const [mid, pendingRequest] of this.pendinRequests.entries()) {
              if (pendingRequest.reject === reject) {
                this.pendinRequests.delete(mid);
                reject(error);
                return;
              }
            }
          }
        });
        this.registerCloseHandler(call);
      }
      const call = this.connections.get(ip);
      if (!call) return;
      const cmd = this.serializeCommand({ command });
      this.writeDataWithBackpressure(call, cmd)
        .then(() => {
          this.pendinRequests.set(cmd.getId(), {
            resolve,
            reject,
            startedAt: Date.now(),
          });
          this.logger.debug(
            {
              pendinRequests: Array.from(this.pendinRequests.keys()),
            },
            `added a pending request to set`,
          );
          //request initiated, setup the cleaner
          this.setupRequestCleaner();
          this.logger.debug(
            { ip, cmd, method: "sendMessage" },
            `request sent to peer`,
          );
        })
        .catch(reject);
    });
  }

  onMessage(
    callback: (
      command: Command,
    ) => Command | undefined | Promise<Command | undefined>,
  ): void {
    this.executeCallback = callback;
  }

  onMessageStream(
    callback: (command: Command) => AsyncGenerator<Command>,
  ): void {
    this.executeStreamCallback = callback;
  }

  setIp(ip: string): void {
    this.ip = ip;
  }

  async stop(): Promise<void> {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
    }
    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server.tryShutdown((err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    }
  }
}
