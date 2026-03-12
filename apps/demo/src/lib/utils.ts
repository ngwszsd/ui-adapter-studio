import { twMerge } from '@teamhelper/ui';
import { type ClassValue, clsx } from '@teamhelper/ui';
export type { ClassValue };
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 通用文件下载函数，兼容 URL 字符串 和 Blob 对象
 * @param data - 文件数据，可以是 Blob 或可下载的 URL（字符串）
 * @param filename - 下载时使用的文件名（如 "report.pdf"）
 */
export function downloadFile(data: string | Blob, filename: string): void {
  const link = document.createElement('a');
  let url: string;
  if (typeof data === 'string') {
    url = data;
  } else {
    url = URL.createObjectURL(data);
  }
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof data !== 'string') {
    URL.revokeObjectURL(url);
  }
}
export function maskPhone(phone?: string) {
  if (!phone) return '';
  const str = phone.replace(/\s+/g, ''); // 去除空格
  if (/^1[3-9]\d{9}$/.test(str)) {
    return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  return phone; // 不符合格式则原样返回
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return phone;
  // 只保留数字字符
  const digits = phone.replace(/\D/g, '');
  // 检查是否为11位手机号
  if (digits.length !== 11) {
    throw new Error('手机号必须是11位数字');
  }
  // 按 3-4-4 格式分段并用空格连接
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

export function listToTree<T extends Record<string, any>>(
  list: T[],
  options?: { idKey?: string; parentIdKey?: string; rootParentValues?: any[] },
): Array<T & { children?: any[] }> {
  const idKey = options?.idKey ?? 'id';
  const parentIdKey = options?.parentIdKey ?? 'parent_id';
  const rootValues = options?.rootParentValues ?? ['', null, undefined];
  const map = new Map<any, T & { children: any[] }>();
  for (const item of list) {
    map.set(item[idKey], { ...item, children: [] });
  }
  const roots: Array<T & { children: any[] }> = [];
  for (const node of map.values()) {
    const parentId = (node as any)[parentIdKey];
    if (rootValues.some((v) => v === parentId) || !map.has(parentId)) {
      roots.push(node);
    } else {
      const parent = map.get(parentId)!;
      parent.children.push(node);
    }
  }
  return roots;
}

export const formatFileSize = (size: number) => {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)}KB`;
  return `${(size / (1024 * 1024)).toFixed(2)}MB`;
};

export const generateMarks = (min: number, max: number, count = 6) => {
  count = count - 1;
  if (count < 1) return {};

  const marks: Record<number, string> = {};
  const step = (max - min) / count;
  for (let i = 0; i <= count; i++) {
    const val = Number((min + i * step).toFixed(2));
    marks[val] = String(val);
  }
  return marks;
};

/**
 * 版本号自动递增函数
 * eg：v1.1.1 => v1.1.2
 * @param versionCode
 */
export const incrementVersion = (versionCode: string): string => {
  try {
    // 匹配版本号格式 v1.2.3
    const match = versionCode.match(/^v(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
      return '';
    }

    const [, major, minor, patch] = match;
    const newPatch = parseInt(patch, 10) + 1;
    return `v${major}.${minor}.${newPatch}`;
  } catch (error) {
    return '';
  }
};
