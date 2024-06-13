// package: hashring
// file: hashring.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";

export class StreamCommand extends jspb.Message {
  getNamespace(): string;
  setNamespace(value: string): StreamCommand;
  getCommand(): string;
  setCommand(value: string): StreamCommand;
  getKey(): string;
  setKey(value: string): StreamCommand;

  hasPayload(): boolean;
  clearPayload(): void;
  getPayload(): string | undefined;
  setPayload(value: string): StreamCommand;
  getIp(): string;
  setIp(value: string): StreamCommand;
  getId(): string;
  setId(value: string): StreamCommand;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamCommand.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: StreamCommand,
  ): StreamCommand.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: StreamCommand,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): StreamCommand;
  static deserializeBinaryFromReader(
    message: StreamCommand,
    reader: jspb.BinaryReader,
  ): StreamCommand;
}

export namespace StreamCommand {
  export type AsObject = {
    namespace: string;
    command: string;
    key: string;
    payload?: string;
    ip: string;
    id: string;
  };
}
