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
import { StreamCommand } from "./proto/hashring_pb";
import { type pino } from "pino";
import { buildLogger } from "../helpers/logger";

type PendingRequestValue = {
  resolve: (value: Command | PromiseLike<Command>) => void;
  reject: (err: ServiceError) => void;
  startedAt: number;
};

type DuplexStream =
  | ServerDuplexStream<StreamCommand, StreamCommand>
  | ClientDuplexStream<StreamCommand, StreamCommand>;
export class RpcNetManager implements InetManager {
  executeCallback: (
    command: Command,
  ) => Promise<Command | undefined> | Command | undefined;

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

      for (const [mid, pendingRequest] of this.pendinRequests.entries()) {
        const elapsedTime = currentTime - pendingRequest.startedAt;
        if (elapsedTime > timeout) {
          const metadata = new Metadata();
          metadata.set("mid", mid);
          const serviceError: ServiceError = {
            name: "TimedOut",
            message: `Request did not finish within ${timeout}ms`,
            details: `Request did not finish within ${timeout}ms`,
            code: grpcStatus.ABORTED,
            metadata,
          };
          this.logger.warn({ serviceError }, `request aborted due to timeout`);
          pendingRequest.reject(serviceError);
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

  private serializeCommand(command: Command, mid?: string): StreamCommand {
    const streamCommand = new StreamCommand();
    streamCommand.setCommand(command.command);
    streamCommand.setKey(command.key);
    streamCommand.setNamespace(command.namespace);
    streamCommand.setIp(this.ip);
    if (command.payload)
      streamCommand.setPayload(JSON.stringify(command.payload));
    streamCommand.setId(mid ?? nanoid());
    this.logger.debug({ command, streamCommand }, `Command serialized`);
    return streamCommand;
  }

  private deSerializeCommand(streamCommand: StreamCommand): Command {
    const payload = streamCommand.getPayload();
    const command: Command = {
      command: streamCommand.getCommand(),
      key: streamCommand.getKey(),
      namespace: streamCommand.getNamespace(),
      payload: payload ? JSON.parse(payload) : undefined,
    };
    this.logger.debug({ command, streamCommand }, `Command deserialized`);
    return command;
  }

  private async onRequest(
    streamCommand: StreamCommand,
    call: DuplexStream,
  ): Promise<void> {
    const command = this.deSerializeCommand(streamCommand);
    const mid = streamCommand.getId();
    const { resolve } = this.pendinRequests.get(mid) || {};
    if (resolve) {
      this.logger.debug(
        { streamCommand, command, method: "onRequest" },
        `response from peer`,
      );
      // this is a response, so resolve it
      resolve(command);
      this.pendinRequests.delete(mid);
      return;
    }
    this.logger.debug(
      { streamCommand, method: "onRequest" },
      `request from peer`,
    );

    let response;
    try {
      response = await this.executeCallback(command);
    } catch (err) {
      const metadata = new Metadata();
      metadata.set("mid", mid);
      const serviceError: ServiceError = {
        name: "Internal",
        message: err.message,
        details: err.stack,
        code: grpcStatus.INTERNAL,
        metadata,
      };
      this.logger.warn(
        { err, serviceError, command },
        `error occurred sending error response back to the peer`,
      );
      call.emit("error", serviceError);
      return;
    }

    const cmd = response
      ? this.serializeCommand(response, mid)
      : this.serializeCommand(
          { ...command, command: PredefinedCommandsEnum.EmptyReply },
          mid,
        );

    const writeCallback = (err: Error): void => {
      if (err) {
        this.logger.error(
          { command: cmd, err, method: "onRequest" },
          `Failed to send resonse back to the peer`,
        );
        return;
      }
      this.logger.debug(
        { command: cmd, method: "onRequest" },
        `sent resonse back to the peer`,
      );
    };
    const canWriteMore = call.write(cmd, writeCallback);
    this.logger.debug(
      { canWriteMore },
      `onRequest call write response receieved`,
    );
  }

  private registerCloseHandler(
    call:
      | ServerDuplexStream<StreamCommand, StreamCommand>
      | ClientDuplexStream<StreamCommand, StreamCommand>,
  ): void {
    const handleConClose = (): void => {
      for (const key of this.connections.keys()) {
        if (this.connections.get(key) === call) {
          this.connections.delete(key);
        }
      }
      call.removeListener("end", handleConClose);
      call.removeListener("close", handleConClose);
      call.removeListener("data", this.onMessage.bind(this));
      call.removeListener("error", this.handleError.bind(this));
    };
    call.on("end", handleConClose);
    call.on("close", handleConClose);
  }

  private handleError(error: ServiceError | Error): void {
    if ("metadata" in error) {
      const values = error.metadata.get("mid");
      if (values.length) {
        const req = this.pendinRequests.get(String(values[0]));
        if (req) {
          this.logger.warn(
            { error },
            `Error received, rejecting to pending request`,
          );
          req.reject(error);
          return;
        }
      }
    }
    this.logger.warn({ error }, `Error received but no pending requests found`);
  }

  private getService(): IHashRingServer {
    const connections = this.connections;
    const onData = this.onRequest.bind(this) as typeof this.onRequest;
    const onError = this.handleError.bind(this) as typeof this.handleError;
    const logger = this.logger;
    const closeHandler = this.registerCloseHandler.bind(this);
    const HashRingServer: IHashRingServer = {
      executeCommand: function (
        call: ServerDuplexStream<StreamCommand, StreamCommand>,
      ): void {
        call.on("data", (message: StreamCommand) => {
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
          closeHandler(call);
        });
        call.on("error", onError);
      },
    };
    return HashRingServer;
  }

  async sendMessage<
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
        deadline.setHours(deadline.getMinutes() + 30);
        const call = client.executeCommand({ deadline });
        this.connections.set(ip, call);

        this.logger.debug(
          { connections: Array.from(this.connections.keys()) },
          `added a new connection to set from sendMessage`,
        );
        call.on("data", (data: StreamCommand) => {
          void this.onRequest(data, call);
        });
        call.on("error", (error) => {
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
          this.handleError(error);
        });
        this.registerCloseHandler(call);
      }
      const call = this.connections.get(ip);
      if (!call) return;
      const cmd = this.serializeCommand(command);
      const canWriteMore = call.write(cmd, (err) => {
        if (err) {
          reject(err);
        }
      });
      this.pendinRequests.set(cmd.getId(), {
        resolve,
        reject,
        startedAt: Date.now(),
      });
      this.logger.debug(
        {
          canWriteMore,
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
    });
  }

  onMessage(
    callback: (
      command: Command,
    ) => Command | undefined | Promise<Command | undefined>,
  ): void {
    this.executeCallback = callback;
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
