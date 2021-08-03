import path from "path";
import util from "util";
import fs from "fs";
import http from "http";
/**
 * 返回图片的 mime 类型
 * @param pic 图片的路径
 * @returns
 */
function picMimeType(pic: string) {
  var mimes: any = {
    ".png": "image/png",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  };
  var ext = path.extname(pic);
  var mime = mimes[ext];
  return mime;
}

/**
 * 构建form 表单的字段
 * @param field 表单的 key
 * @param value 表单的 value
 * @returns
 */
function fillFormField(field: string, value: string | number) {
  return util.format(
    'Content-Disposition: form-data; name="%s"\r\n\r\n%s',
    field,
    value
  );
}

/**
 * 构建 form 表单请求的内容
 * @param fields 所有的 form 表单的 field
 * @param filePath 需要上传的文件路径
 */
function genFormBody(
  fields: Record<string, string | number>,
  filePath: string
): Record<"body" | "boundary", string> {
  let data: string[] = [];
  // 取代 file 字段
  const fileName = fields["file"];
  delete fields.file;
  for (const i in fields) {
    data.push(fillFormField(i, fields[i]));
  }
  // 处理图片的内容
  const picBuffer = fs.readFileSync(filePath);
  data.push(
    util.format(
      'Content-Disposition: form-data; name="file"; filename="%s"\r\n',
      fileName
    ) +
      util.format("Content-Type: %s\r\n\r\n", picMimeType(filePath)) +
      picBuffer
  );
  const max = 9007199254740992;
  const dec = Math.random() * max;
  const hex = dec.toString(36);
  const boundary = "----WebKitFormBoundary" + hex;
  let body =
    util.format("--%s\r\n", boundary) +
    data.join(util.format("\r\n--%s\r\n", boundary)) +
    util.format("\r\n--%s--", boundary);
  return {
    boundary,
    body,
  };
}

/**
 * 发送请求
 * @param options 请求的参数
 * @param fields 请求需要穿的表单字段
 * @param filePath 上传文件的路径
 */
function postRequest(
  options: Record<string, string>,
  fields: Record<string, string | number>,
  filePath: string
) {
  options = {
    method: "POST",
    ...options,
  };
  let { body, boundary } = genFormBody(fields, filePath);
  // 发送请求
  let cliRequest = http.request(options, (res) => {
    res.on("data", function (resBody) {
      console.log("resBody:" + resBody);
    });
    res.on("error", function (error) {
      console.error(error);
    });
  });

  // 设置发送请求的内容和请求头
  cliRequest.setHeader(
    "Content-Type",
    "multipart/form-data; boundary=" + boundary
  );
  cliRequest.setHeader("Content-Length", Buffer.from(body).length);
  console.log("body", body);
  cliRequest.write(body);
  cliRequest.end();
  console.log(cliRequest.getHeaders());
  cliRequest.on("error", (e) => {
    console.error(`problem with request: ${e.message}`);
  });
}

export default postRequest;
