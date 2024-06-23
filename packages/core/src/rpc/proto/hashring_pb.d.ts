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
  };
}

export class ErrorResponse extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): ErrorResponse;
  getCode(): string;
  setCode(value: string): ErrorResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ErrorResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ErrorResponse,
  ): ErrorResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ErrorResponse,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): ErrorResponse;
  static deserializeBinaryFromReader(
    message: ErrorResponse,
    reader: jspb.BinaryReader,
  ): ErrorResponse;
}

export namespace ErrorResponse {
  export type AsObject = {
    message: string;
    code: string;
  };
}

export class PeerPayload extends jspb.Message {
  hasCommand(): boolean;
  clearCommand(): void;
  getCommand(): StreamCommand | undefined;
  setCommand(value?: StreamCommand): PeerPayload;

  hasError(): boolean;
  clearError(): void;
  getError(): ErrorResponse | undefined;
  setError(value?: ErrorResponse): PeerPayload;
  getId(): string;
  setId(value: string): PeerPayload;
  getIp(): string;
  setIp(value: string): PeerPayload;

  getResponseCase(): PeerPayload.ResponseCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PeerPayload.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PeerPayload,
  ): PeerPayload.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: PeerPayload,
    writer: jspb.BinaryWriter,
  ): void;
  static deserializeBinary(bytes: Uint8Array): PeerPayload;
  static deserializeBinaryFromReader(
    message: PeerPayload,
    reader: jspb.BinaryReader,
  ): PeerPayload;
}

export namespace PeerPayload {
  export type AsObject = {
    command?: StreamCommand.AsObject;
    error?: ErrorResponse.AsObject;
    id: string;
    ip: string;
  };

  export enum ResponseCase {
    RESPONSE_NOT_SET = 0,
    COMMAND = 1,
    ERROR = 2,
  }
}
