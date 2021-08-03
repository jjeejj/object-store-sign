import { OSSSign } from "../src/index";
import postRequest from "./request";

/** 阿里云 oss 测试  */
const cli = new OSSSign({
  accessKeyId: "",
  accessKeySecret: "",
  maxSize: 1000000,
  bucket: "j-resource",
});
const token = cli.sign("test.png");

// 发送上传文件的请求
postRequest(
  {
    host: "j-resource.oss-cn-shenzhen.aliyuncs.com",
    // port: "80",
    // prprotocol: "https",
  },
  {
    key: "test.png",
    file: "test.png",
    policy: token.policy,
    Signature: token.signature,
    success_action_status: 200,
    OSSAccessKeyId: token.accessid,
  },
  "/Users/jiang/Repo/oss-sign/test/test.png"
);
