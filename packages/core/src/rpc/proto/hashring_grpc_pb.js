// GENERATED CODE -- DO NOT EDIT!

"use strict";
var grpc = require("@grpc/grpc-js");
var hashring_pb = require("./hashring_pb.js");
var google_protobuf_any_pb = require("google-protobuf/google/protobuf/any_pb.js");

function serialize_hashring_StreamCommand(arg) {
  if (!(arg instanceof hashring_pb.StreamCommand)) {
    throw new Error("Expected argument of type hashring.StreamCommand");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hashring_StreamCommand(buffer_arg) {
  return hashring_pb.StreamCommand.deserializeBinary(
    new Uint8Array(buffer_arg),
  );
}

var HashRingService = (exports.HashRingService = {
  executeCommand: {
    path: "/hashring.HashRing/executeCommand",
    requestStream: true,
    responseStream: true,
    requestType: hashring_pb.StreamCommand,
    responseType: hashring_pb.StreamCommand,
    requestSerialize: serialize_hashring_StreamCommand,
    requestDeserialize: deserialize_hashring_StreamCommand,
    responseSerialize: serialize_hashring_StreamCommand,
    responseDeserialize: deserialize_hashring_StreamCommand,
  },
});

exports.HashRingClient = grpc.makeGenericClientConstructor(HashRingService);
