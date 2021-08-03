# object-store-sign

## 阿里云 OSS 签名

```javascript
const { OSSSign } = require("object-store-sign");

const signer = new OSSSign({
  accessKeyId: "xxx",
  accessKeySecret: "xxx",
  endpoint: "http://xxx.oss-cn-hangzhou.aliyuncs.com",
  maxSize: 1000000,
  bucket: "j-resource",
});

/**
 * 获取 OSS 签名
 * @param 签名的key
 */
signer.sign("filename.jpg");
```

## 腾讯云 COS 签名

```javascript
const { COSSign } = require("object-store-sign");

const signer = new COSSign({
  secretId: "",
  secretKey: "",
  maxSize: 1000000000,
  bucket: "gz-h5-test-1251517970",
  endpoint: "",
});

/**
 * 获取 OSS 签名
 * @param 签名的key
 */
signer.sign("filename.jpg");
```

注意：**bucket 必须设置了 Cors(Post 打勾）,不然没有办法上传**
