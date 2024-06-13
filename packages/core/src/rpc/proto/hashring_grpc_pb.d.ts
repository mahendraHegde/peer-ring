// package: hashring
// file: hashring.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as hashring_pb from "./hashring_pb";
import * as google_protobuf_any_pb from "google-protobuf/google/protobuf/any_pb";

interface IHashRingService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  executeCommand: IHashRingService_IexecuteCommand;
}

interface IHashRingService_IexecuteCommand
  extends grpc.MethodDefinition<
    hashring_pb.StreamCommand,
    hashring_pb.StreamCommand
  > {
  path: "/hashring.HashRing/executeCommand";
  requestStream: true;
  responseStream: true;
  requestSerialize: grpc.serialize<hashring_pb.StreamCommand>;
  requestDeserialize: grpc.deserialize<hashring_pb.StreamCommand>;
  responseSerialize: grpc.serialize<hashring_pb.StreamCommand>;
  responseDeserialize: grpc.deserialize<hashring_pb.StreamCommand>;
}

export const HashRingService: IHashRingService;

export interface IHashRingServer extends grpc.UntypedServiceImplementation {
  executeCommand: grpc.handleBidiStreamingCall<
    hashring_pb.StreamCommand,
    hashring_pb.StreamCommand
  >;
}

export interface IHashRingClient {
  executeCommand(): grpc.ClientDuplexStream<
    hashring_pb.StreamCommand,
    hashring_pb.StreamCommand
  >;
  executeCommand(
    options: Partial<grpc.CallOptions>,
  ): grpc.ClientDuplexStream<
    hashring_pb.StreamCommand,
    hashring_pb.StreamCommand
  >;
  executeCommand(
    metadata: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientDuplexStream<
    hashring_pb.StreamCommand,
    hashring_pb.StreamCommand
  >;
}

export class HashRingClient extends grpc.Client implements IHashRingClient {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: Partial<grpc.ClientOptions>,
  );
  public executeCommand(
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientDuplexStream<
    hashring_pb.StreamCommand,
    hashring_pb.StreamCommand
  >;
  public executeCommand(
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientDuplexStream<
    hashring_pb.StreamCommand,
    hashring_pb.StreamCommand
  >;
}
