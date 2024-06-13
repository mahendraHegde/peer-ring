// source: hashring.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require("google-protobuf");
var goog = jspb;
var global = function () {
  if (this) {
    return this;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  return Function("return this")();
}.call(null);

var google_protobuf_any_pb = require("google-protobuf/google/protobuf/any_pb.js");
goog.object.extend(proto, google_protobuf_any_pb);
goog.exportSymbol("proto.hashring.StreamCommand", null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.hashring.StreamCommand = function (opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.hashring.StreamCommand, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.hashring.StreamCommand.displayName = "proto.hashring.StreamCommand";
}

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.hashring.StreamCommand.prototype.toObject = function (
    opt_includeInstance,
  ) {
    return proto.hashring.StreamCommand.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.hashring.StreamCommand} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.hashring.StreamCommand.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        namespace: jspb.Message.getFieldWithDefault(msg, 1, ""),
        command: jspb.Message.getFieldWithDefault(msg, 2, ""),
        key: jspb.Message.getFieldWithDefault(msg, 3, ""),
        payload: jspb.Message.getFieldWithDefault(msg, 4, ""),
        ip: jspb.Message.getFieldWithDefault(msg, 5, ""),
        id: jspb.Message.getFieldWithDefault(msg, 6, ""),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.hashring.StreamCommand}
 */
proto.hashring.StreamCommand.deserializeBinary = function (bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.hashring.StreamCommand();
  return proto.hashring.StreamCommand.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.hashring.StreamCommand} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.hashring.StreamCommand}
 */
proto.hashring.StreamCommand.deserializeBinaryFromReader = function (
  msg,
  reader,
) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {string} */ (reader.readString());
        msg.setNamespace(value);
        break;
      case 2:
        var value = /** @type {string} */ (reader.readString());
        msg.setCommand(value);
        break;
      case 3:
        var value = /** @type {string} */ (reader.readString());
        msg.setKey(value);
        break;
      case 4:
        var value = /** @type {string} */ (reader.readString());
        msg.setPayload(value);
        break;
      case 5:
        var value = /** @type {string} */ (reader.readString());
        msg.setIp(value);
        break;
      case 6:
        var value = /** @type {string} */ (reader.readString());
        msg.setId(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.hashring.StreamCommand.prototype.serializeBinary = function () {
  var writer = new jspb.BinaryWriter();
  proto.hashring.StreamCommand.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.hashring.StreamCommand} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.hashring.StreamCommand.serializeBinaryToWriter = function (
  message,
  writer,
) {
  var f = undefined;
  f = message.getNamespace();
  if (f.length > 0) {
    writer.writeString(1, f);
  }
  f = message.getCommand();
  if (f.length > 0) {
    writer.writeString(2, f);
  }
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(3, f);
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 4));
  if (f != null) {
    writer.writeString(4, f);
  }
  f = message.getIp();
  if (f.length > 0) {
    writer.writeString(5, f);
  }
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(6, f);
  }
};

/**
 * optional string namespace = 1;
 * @return {string}
 */
proto.hashring.StreamCommand.prototype.getNamespace = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};

/**
 * @param {string} value
 * @return {!proto.hashring.StreamCommand} returns this
 */
proto.hashring.StreamCommand.prototype.setNamespace = function (value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};

/**
 * optional string command = 2;
 * @return {string}
 */
proto.hashring.StreamCommand.prototype.getCommand = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};

/**
 * @param {string} value
 * @return {!proto.hashring.StreamCommand} returns this
 */
proto.hashring.StreamCommand.prototype.setCommand = function (value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};

/**
 * optional string key = 3;
 * @return {string}
 */
proto.hashring.StreamCommand.prototype.getKey = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};

/**
 * @param {string} value
 * @return {!proto.hashring.StreamCommand} returns this
 */
proto.hashring.StreamCommand.prototype.setKey = function (value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};

/**
 * optional string payload = 4;
 * @return {string}
 */
proto.hashring.StreamCommand.prototype.getPayload = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};

/**
 * @param {string} value
 * @return {!proto.hashring.StreamCommand} returns this
 */
proto.hashring.StreamCommand.prototype.setPayload = function (value) {
  return jspb.Message.setField(this, 4, value);
};

/**
 * Clears the field making it undefined.
 * @return {!proto.hashring.StreamCommand} returns this
 */
proto.hashring.StreamCommand.prototype.clearPayload = function () {
  return jspb.Message.setField(this, 4, undefined);
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.hashring.StreamCommand.prototype.hasPayload = function () {
  return jspb.Message.getField(this, 4) != null;
};

/**
 * optional string ip = 5;
 * @return {string}
 */
proto.hashring.StreamCommand.prototype.getIp = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};

/**
 * @param {string} value
 * @return {!proto.hashring.StreamCommand} returns this
 */
proto.hashring.StreamCommand.prototype.setIp = function (value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};

/**
 * optional string id = 6;
 * @return {string}
 */
proto.hashring.StreamCommand.prototype.getId = function () {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};

/**
 * @param {string} value
 * @return {!proto.hashring.StreamCommand} returns this
 */
proto.hashring.StreamCommand.prototype.setId = function (value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};

goog.object.extend(exports, proto.hashring);
