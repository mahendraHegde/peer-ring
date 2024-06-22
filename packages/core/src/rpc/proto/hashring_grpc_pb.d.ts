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
  executeServerStreamCommand: IHashRingService_IexecuteServerStreamCommand;
}

interface IHashRingService_IexecuteCommand
  extends grpc.MethodDefinition<
    hashring_pb.PeerPayload,
    hashring_pb.PeerPayload
  > {
  path: "/hashring.HashRing/executeCommand";
  requestStream: true;
  responseStream: true;
  requestSerialize: grpc.serialize<hashring_pb.PeerPayload>;
  requestDeserialize: grpc.deserialize<hashring_pb.PeerPayload>;
  responseSerialize: grpc.serialize<hashring_pb.PeerPayload>;
  responseDeserialize: grpc.deserialize<hashring_pb.PeerPayload>;
}
interface IHashRingService_IexecuteServerStreamCommand
  extends grpc.MethodDefinition<
    hashring_pb.PeerPayload,
    hashring_pb.PeerPayload
  > {
  path: "/hashring.HashRing/executeServerStreamCommand";
  requestStream: false;
  responseStream: true;
  requestSerialize: grpc.serialize<hashring_pb.PeerPayload>;
  requestDeserialize: grpc.deserialize<hashring_pb.PeerPayload>;
  responseSerialize: grpc.serialize<hashring_pb.PeerPayload>;
  responseDeserialize: grpc.deserialize<hashring_pb.PeerPayload>;
}

export const HashRingService: IHashRingService;

export interface IHashRingServer extends grpc.UntypedServiceImplementation {
  executeCommand: grpc.handleBidiStreamingCall<
    hashring_pb.PeerPayload,
    hashring_pb.PeerPayload
  >;
  executeServerStreamCommand: grpc.handleServerStreamingCall<
    hashring_pb.PeerPayload,
    hashring_pb.PeerPayload
  >;
}

export interface IHashRingClient {
  executeCommand(): grpc.ClientDuplexStream<
    hashring_pb.PeerPayload,
    hashring_pb.PeerPayload
  >;
  executeCommand(
    options: Partial<grpc.CallOptions>,
  ): grpc.ClientDuplexStream<hashring_pb.PeerPayload, hashring_pb.PeerPayload>;
  executeCommand(
    metadata: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientDuplexStream<hashring_pb.PeerPayload, hashring_pb.PeerPayload>;
  executeServerStreamCommand(
    request: hashring_pb.PeerPayload,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hashring_pb.PeerPayload>;
  executeServerStreamCommand(
    request: hashring_pb.PeerPayload,
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hashring_pb.PeerPayload>;
}

export class HashRingClient extends grpc.Client implements IHashRingClient {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: Partial<grpc.ClientOptions>,
  );
  public executeCommand(
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientDuplexStream<hashring_pb.PeerPayload, hashring_pb.PeerPayload>;
  public executeCommand(
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientDuplexStream<hashring_pb.PeerPayload, hashring_pb.PeerPayload>;
  public executeServerStreamCommand(
    request: hashring_pb.PeerPayload,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hashring_pb.PeerPayload>;
  public executeServerStreamCommand(
    request: hashring_pb.PeerPayload,
    metadata?: grpc.Metadata,
    options?: Partial<grpc.CallOptions>,
  ): grpc.ClientReadableStream<hashring_pb.PeerPayload>;
}
