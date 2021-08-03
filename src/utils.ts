import crypto, { HexBase64Latin1Encoding } from "crypto";

// 计算指定的数据 指定的密钥 进行 sha1 签名 并返回对应的 base64 的编码
export function getHMacSha1Hash(
  data: string,
  secret: string,
  encoding: HexBase64Latin1Encoding = "base64"
) {
  return crypto.createHmac("sha1", secret).update(data).digest(encoding);
}

// 计算指定数据的 sha1 hash 值
export function getSha1Hash(
  data: string,
  encoding: HexBase64Latin1Encoding = "base64"
) {
  return crypto.createHash("sha1").update(data).digest(encoding);
}
