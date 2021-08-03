/**
 * 对象存储签名的类
 * @file Sign
 */

import assert from "assert";
import * as utils from "./utils";

/** 实例化签名 配置项  */
interface IOption {
  /** 默认过期时间（毫秒，默认30s） */
  expire?: number;
  /** 默认上传路径前缀（末尾包含 / ） */
  defaultDir?: string;
  /** 默认最大文件大小（字节） */
  maxSize?: number;
  /** 存储桶的名称 */
  bucket: string;
  /** 访问地址的端点 */
  endpoint?: string;
}

interface IOSSOption extends IOption {
  /** 秘钥ID */
  accessKeyId: string;
  /** 秘钥Key */
  accessKeySecret: string;
}

interface ICOSOption extends IOption {
  /** 秘钥ID */
  secretId: string;
  /** 秘钥Key */
  secretKey: string;
}

export type Option = IOSSOption | ICOSOption;

export type platformType = "oss" | "cos";

export interface ISignOption {
  /** 目录前缀（包含 / ）*/
  dir?: string;
  /** 过期时间（毫秒） */
  expire?: number;
  /** 文件最大尺寸（字节） */
  maxSize?: number;
  /** 存储桶名称 */
  bucket?: string;
}

export interface ISignResult {
  /** 策略 */
  policy: string;
  /** 签名 */
  signature: string;
  /** 过期时间（毫秒） */
  expire: number;
  /** 上传host */
  host?: string;
  /** 前缀 */
  dir?: string;
  /** 上传的key */
  key?: string;
  /** 访问地址的端点 */
  endpoint?: string;
}
/**
 * 阿里云云签名返回的结果
 */
export interface IOSSResult extends ISignResult {
  /** 密钥ID */
  accessid: string;
}
/**
 * 腾讯云签名返回的结果
 */
export interface ICOSResult extends ISignResult {
  /** StartTimestamp;EndTimestamp */
  keyTime: string;
  /** 密钥 id */
  secretId: string;
}

// 签名返回的类型
export type SignResult = ICOSResult | IOSSResult;

interface IPolicys {
  expiration: string;
  conditions: Array<
    [string, string | number, string | number] | Record<string, string>
  >;
}

/**
 * 签名类 基础类
 */
class Sign {
  protected bucket: string; // 存储桶
  protected endpoint?: string; // 访问的端点
  protected expire: number; // 单位 ms
  protected defaultDir?: string;
  /** 上传文件的最大大小 单位字节 */
  protected maxSize?: number;
  protected policy: IPolicys = { expiration: "", conditions: [] };
  protected expireAt: number; // 签名过期时间，单位 ms

  constructor(options: IOption) {
    this.bucket = options.bucket;
    this.endpoint = options.endpoint;
    this.defaultDir = options.defaultDir;
    this.expire = options.expire || 30 * 1000; // 默认 30s
    this.maxSize = options.maxSize;
    this.expireAt = new Date().getTime() + this.expire;
  }
  // 构建 policy 策略的 json 对象
  protected generaPolicy(filename?: string) {
    // 构建 policy
    const expiration = new Date(this.expireAt).toISOString();
    this.policy.expiration = expiration;
    // 处理最大 size 上传文件
    if (this.maxSize) {
      this.policy.conditions.push(["content-length-range", 0, this.maxSize]);
    }
    // 处理文件 key
    if (filename) {
      // 存在文件名使用严格相等判断
      const fielkey = this.defaultDir ? this.defaultDir + filename : filename;
      this.policy.conditions.push(["eq", "$key", fielkey]);
    } else if (this.defaultDir) {
      // 存在目录使用key前缀限制
      this.policy.conditions.push(["starts-with", "$key", this.defaultDir]);
    }
  }
}

/**
 * 阿里云上传文件的签名
 */
export class OSSSign extends Sign {
  private accessKeyId: string;
  private accessKeySecret: string;
  constructor(options: IOSSOption) {
    super(options);
    assert(typeof options.accessKeyId === "string", "请配置 AccessKeyId");
    assert(
      typeof options.accessKeySecret === "string",
      "请配置 AccessKeySecret"
    );
    this.accessKeyId = options.accessKeyId;
    this.accessKeySecret = options.accessKeySecret;
  }
  /**
   * 计算签名
   * @param filename 传入的文件名称
   * @returns
   */
  public sign(filename?: string): IOSSResult {
    this.generaPolicy(filename);
    const policyStr = JSON.stringify(this.policy);
    const base64Policy = Buffer.from(policyStr).toString("base64");
    const signature = utils.getHMacSha1Hash(base64Policy, this.accessKeySecret);
    const expire = parseInt(String(this.expireAt / 1000), 10); // 什么时间过期，单位 s
    return {
      policy: base64Policy,
      signature,
      expire,
      accessid: this.accessKeyId,
      dir: this.defaultDir,
      key: (this.defaultDir || "") + (filename || ""),
      endpoint: this.endpoint,
    };
  }
}

/**
 * 腾讯云计算上传文件签名
 */
export class COSSign extends Sign {
  private secretId: string;
  private secretKey: string;
  constructor(options: ICOSOption) {
    super(options);
    assert(typeof options.secretId === "string", "请配置 secretId");
    assert(typeof options.secretKey === "string", "请配置 secretKey");
    this.secretId = options.secretId;
    this.secretKey = options.secretKey;
  }
  /**
   * 计算签名
   * @param filename 传入的文件名称
   * @returns
   */
  public sign(filename?: string): ICOSResult {
    this.generaPolicy(filename);
    const expire = parseInt(String(this.expireAt / 1000), 10);
    // 计算 SignKey
    const keyTime = parseInt(String(Date.now() / 1000), 10) + ";" + expire;
    this.policy.conditions.push(
      {
        "q-sign-algorithm": "sha1",
      },
      {
        "q-ak": this.secretId,
      },
      {
        "q-sign-time": keyTime,
      }
    );
    const signKey = utils.getHMacSha1Hash(keyTime, this.secretKey, "hex");
    const policyStr = JSON.stringify(this.policy);
    const stringToSign = utils.getSha1Hash(policyStr, "hex");
    // 计算签名
    const signature = utils.getHMacSha1Hash(stringToSign, signKey, "hex");

    return {
      policy: Buffer.from(policyStr).toString("base64"),
      signature,
      expire,
      secretId: this.secretId,
      keyTime,
      dir: this.defaultDir,
      key: (this.defaultDir || "") + (filename || ""),
      endpoint: this.endpoint,
    };
  }
}
