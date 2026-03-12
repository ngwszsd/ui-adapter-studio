import forge from 'node-forge';

/**
 * 密码加密工具 - 使用 node-forge 实现 AES-GCM，支持 HTTP/HTTPS 环境
 * 与原有的 Web Crypto API (AES-GCM) 100% 兼容
 */
export class PasswordCrypto {
  // 从环境变量获取盐值，如果没有则使用默认值
  private static readonly SALT =
    import.meta.env.PUBLIC_PASSWORD_SALT || 'teamhelper_salt_ai_agent';

  /**
   * 使用 AES-GCM 加密密码
   * @param password 原始密码
   * @param secret 密钥（可选，默认使用 SALT）
   * @returns 加密后的密码 (iv.ciphertext+tag)
   */
  static async encryptPassword(
    password: string,
    secret?: string,
  ): Promise<string> {
    const secretKey = secret || this.SALT;

    // 1. 密钥处理：SHA256(secretKey)
    const md = forge.md.sha256.create();
    md.update(secretKey);
    const keyBytes = md.digest().getBytes();

    // 2. 生成随机 IV (12 bytes for GCM)
    const ivBytes = forge.random.getBytesSync(12);

    // 3. 加密
    const cipher = forge.cipher.createCipher('AES-GCM', keyBytes);
    cipher.start({
      iv: ivBytes,
      tagLength: 128, // 16 bytes tag
    });
    cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(password)));
    cipher.finish();

    const ciphertext = cipher.output.getBytes();
    const tag = cipher.mode.tag.getBytes();

    // Web Crypto 的加密结果是 ciphertext + tag
    const combined = ciphertext + tag;

    // 4. 返回格式: b64(iv).b64(combined)
    return `${forge.util.encode64(ivBytes)}.${forge.util.encode64(combined)}`;
  }

  /**
   * 使用 AES-GCM 解密密码（用于本地测试）
   * @param encryptedPassword 加密后的密码 (iv.combined)
   * @param secret 密钥（可选，默认使用 SALT）
   * @returns 解密后的密码
   */
  static async decryptPassword(
    encryptedPassword: string,
    secret?: string,
  ): Promise<string> {
    const secretKey = secret || this.SALT;

    try {
      const [ivB64, combinedB64] = encryptedPassword.split('.');
      if (!ivB64 || !combinedB64) {
        throw new Error('Invalid encrypted password format');
      }

      const ivBytes = forge.util.decode64(ivB64);
      const combinedBytes = forge.util.decode64(combinedB64);

      // 分离 ciphertext 和 tag (最后16字节是 tag)
      const tagOffset = combinedBytes.length - 16;
      const ciphertext = combinedBytes.substring(0, tagOffset);
      const tag = combinedBytes.substring(tagOffset);

      // 密钥处理
      const md = forge.md.sha256.create();
      md.update(secretKey);
      const keyBytes = md.digest().getBytes();

      // 解密
      const decipher = forge.cipher.createDecipher('AES-GCM', keyBytes);
      decipher.start({
        iv: ivBytes,
        tag: forge.util.createBuffer(tag),
        tagLength: 128,
      });
      decipher.update(forge.util.createBuffer(ciphertext));
      const pass = decipher.finish();

      if (!pass) {
        throw new Error('Decryption failed: Integrity check failed');
      }

      return forge.util.decodeUtf8(decipher.output.getBytes());
    } catch (e) {
      console.error('Decryption failed:', e);
      throw new Error('Decryption failed');
    }
  }

  /**
   * SHA256 哈希函数
   */
  static async sha256(text: string): Promise<string> {
    const md = forge.md.sha256.create();
    md.update(text);
    return md.digest().toHex();
  }
}
