// GENERATED CODE -- DO NOT EDIT!

"use strict";
var grpc = require("@grpc/grpc-js");
var hashring_pb = require("./hashring_pb.js");
var google_protobuf_any_pb = require("google-protobuf/google/protobuf/any_pb.js");

function serialize_hashring_PeerPayload(arg) {
  if (!(arg instanceof hashring_pb.PeerPayload)) {
    throw new Error("Expected argument of type hashring.PeerPayload");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hashring_PeerPayload(buffer_arg) {
  return hashring_pb.PeerPayload.deserializeBinary(new Uint8Array(buffer_arg));
}

var HashRingService = (exports.HashRingService = {
  executeCommand: {
    path: "/hashring.HashRing/executeCommand",
    requestStream: true,
    responseStream: true,
    requestType: hashring_pb.PeerPayload,
    responseType: hashring_pb.PeerPayload,
    requestSerialize: serialize_hashring_PeerPayload,
    requestDeserialize: deserialize_hashring_PeerPayload,
    responseSerialize: serialize_hashring_PeerPayload,
    responseDeserialize: deserialize_hashring_PeerPayload,
  },
  executeServerStreamCommand: {
    path: "/hashring.HashRing/executeServerStreamCommand",
    requestStream: false,
    responseStream: true,
    requestType: hashring_pb.PeerPayload,
    responseType: hashring_pb.PeerPayload,
    requestSerialize: serialize_hashring_PeerPayload,
    requestDeserialize: deserialize_hashring_PeerPayload,
    responseSerialize: serialize_hashring_PeerPayload,
    responseDeserialize: deserialize_hashring_PeerPayload,
  },
});

exports.HashRingClient = grpc.makeGenericClientConstructor(HashRingService);
