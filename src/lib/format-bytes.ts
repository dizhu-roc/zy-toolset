/**
 * 将字节数格式化为 KB / MB（1024 进制），避免主界面用裸 `B` 计数。
 */
export function formatByteSizeHuman(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 KB";
  if (bytes === 0) return "0 KB";
  const kb = 1024;
  const mb = kb * 1024;
  if (bytes < kb) {
    return `${(bytes / kb).toFixed(2)} KB`;
  }
  if (bytes < mb) {
    return `${(bytes / kb).toFixed(1)} KB`;
  }
  return `${(bytes / mb).toFixed(2)} MB`;
}
