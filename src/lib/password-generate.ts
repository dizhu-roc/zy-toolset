const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
/** 键盘常见符号，避免过宽的空格与反引号等易在表单出问题的字符 */
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?/";

const AMBIGUOUS = new Set(["0", "O", "o", "1", "l", "I", "|"]);

function stripAmbiguous(pool: string, exclude: boolean): string {
  if (!exclude) return pool;
  return [...pool].filter((c) => !AMBIGUOUS.has(c)).join("");
}

/** 均匀分布的 [0, max) 整数 */
function randomInt(max: number): number {
  if (max <= 0) return 0;
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= limit);
  return x % max;
}

export type PasswordGenOptions = {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  eachRequired: boolean;
  excludeAmbiguous: boolean;
};

export const PASSWORD_LENGTH_MIN = 8;
export const PASSWORD_LENGTH_MAX = 64;
export const PASSWORD_LENGTH_DEFAULT = 16;

export function buildPools(opts: PasswordGenOptions): string[] {
  const pools: string[] = [];
  if (opts.uppercase) {
    const p = stripAmbiguous(UPPER, opts.excludeAmbiguous);
    if (p.length > 0) pools.push(p);
  }
  if (opts.lowercase) {
    const p = stripAmbiguous(LOWER, opts.excludeAmbiguous);
    if (p.length > 0) pools.push(p);
  }
  if (opts.numbers) {
    const p = stripAmbiguous(DIGITS, opts.excludeAmbiguous);
    if (p.length > 0) pools.push(p);
  }
  if (opts.symbols) {
    const p = stripAmbiguous(SYMBOLS, opts.excludeAmbiguous);
    if (p.length > 0) pools.push(p);
  }
  return pools;
}

/** 合并后的字符空间（去重顺序：按池顺序拼接后去重） */
export function mergeCharset(pools: string[]): string {
  if (pools.length === 0) return "";
  const seen = new Set<string>();
  let out = "";
  for (const pool of pools) {
    for (const c of pool) {
      if (!seen.has(c)) {
        seen.add(c);
        out += c;
      }
    }
  }
  return out;
}

function shuffleInPlace(chars: string[]): void {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const a = chars[i]!;
    const b = chars[j]!;
    chars[i] = b;
    chars[j] = a;
  }
}

/**
 * 使用 `crypto.getRandomValues` 生成密码。
 * @throws 未选择字符类型、或去易混后某类为空时抛出简短英文错误（由 UI 映射为文案）
 */
export function generatePassword(opts: PasswordGenOptions): string {
  const len = Math.min(PASSWORD_LENGTH_MAX, Math.max(PASSWORD_LENGTH_MIN, Math.floor(opts.length)));
  const pools = buildPools(opts);
  if (pools.length === 0) {
    throw new Error("NO_CHARSET");
  }
  const charset = mergeCharset(pools);
  if (charset.length === 0) {
    throw new Error("NO_CHARSET");
  }

  if (opts.eachRequired) {
    for (const pool of pools) {
      if (pool.length === 0) {
        throw new Error("EMPTY_POOL");
      }
    }
    const chars: string[] = [];
    for (const pool of pools) {
      chars.push(pool[randomInt(pool.length)]!);
    }
    while (chars.length < len) {
      chars.push(charset[randomInt(charset.length)]!);
    }
    shuffleInPlace(chars);
    return chars.join("");
  }

  let out = "";
  for (let i = 0; i < len; i++) {
    out += charset[randomInt(charset.length)]!;
  }
  return out;
}

/** 近似熵（比特）：长度 × log2(|字符空间|)，用于展示 */
export function estimateEntropyBits(charsetSize: number, length: number): number {
  if (charsetSize < 2 || length < 1) return 0;
  return Math.round(length * (Math.log(charsetSize) / Math.log(2)) * 10) / 10;
}
