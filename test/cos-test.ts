import { COSSign } from "../src/index";
import postRequest from "./request";

/** 腾讯云 oss 测试  */
const cli = new COSSign({
  secretId: "",
  secretKey: "",
  maxSize: 1000000000,
  bucket: "gz-h5-test-1251517970",
  // defaultDir: "",
  expire: 60 * 1000,
});
const token = cli.sign("test.png");

// 发送上传文件的请求
postRequest(
  {
    host: "gz-h5-test-1251517970.cos.ap-guangzhou.myqcloud.com",
  },
  {
    key: token.key!,
    file: "test.png",
    policy: token.policy,
    success_action_status: 200,
    "q-signature": token.signature,
    "q-sign-algorithm": "sha1",
    "q-ak": token.secretId,
    "q-key-time": token.keyTime,
  },
  "/Users/jiang/Repo/oss-sign/test/test.png"
);
