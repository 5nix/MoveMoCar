# Security

## Reporting an issue

Please do not include real phone numbers, notification keys, webhook credentials, or private QR code configurations in public issues.

When reporting a security issue, describe the affected feature, reproduction steps, expected behavior, and actual behavior using test data.

## Security model

MoveMoCar is a static frontend application. Contact details and notification settings are stored in the QR code and processed in the visitor's browser. They are not uploaded to or stored by a MoveMoCar backend.

Anyone who obtains the QR code can still inspect its contents. MoveMoCar reduces casual exposure of a phone number; it does not make information embedded in the code secret.

The 15-second sending interval is an interface safeguard, not a security rate limit.

## Recommendations

- Use random, hard-to-guess notification keys and ntfy topics.
- Replace a QR code after changing a phone number or notification configuration.
- Revoke and replace any notification credential that has been exposed.
- Use a backend or serverless function if your deployment requires hidden credentials or enforced rate limiting.

---

# 安全说明

## 报告问题

请不要在公开 Issue 中包含真实电话号码、通知密钥、Webhook 凭据或私密的二维码配置。

报告安全问题时，请使用测试数据说明受影响的功能、复现步骤、预期结果和实际结果。

## 安全边界

MoveMoCar 是纯前端静态应用。联系方式和通知配置存放在二维码中，并由访问者的浏览器处理，不会上传或保存到 MoveMoCar 后端。

任何获得二维码的人仍然可以分析其中的内容。MoveMoCar 用于减少手机号在日常场景中的直接暴露，并不会把二维码内的信息变成秘密。

前端的 15 秒发送间隔是界面限制，不是安全限流。

## 使用建议

- 使用随机且难以猜测的通知密钥和 ntfy 主题。
- 更换手机号或通知配置后，重新生成并替换二维码。
- 通知凭据泄露后，及时撤销并更换。
- 如果部署场景需要隐藏凭据或强制限流，请使用后端或 Serverless 函数。
