/**
 * 将 JSON 字符串转换为 ApiParam 数组格式
 * @param jsonStr JSON 字符串
 * @returns 转换后的数组
 */
export function jsonToBodyParamList(jsonStr: string) {
  try {
    if (!jsonStr || jsonStr.trim() === '') return [];
    const obj = JSON.parse(jsonStr);
    if (typeof obj !== 'object' || obj === null) {
      return [{ code: '', value: jsonStr, enable: true }];
    }

    return Object.entries(obj).map(([key, value]) => ({
      code: key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      enable: true,
    }));
  } catch (e) {
    // 如果解析失败，回退为单个项
    return [{ code: '', value: jsonStr, enable: true }];
  }
}

/**
 * 将 ApiParam 数组格式转换回 JSON 字符串
 * @param paramList 数组格式
 * @returns JSON 字符串
 */
export function bodyParamListToJson(paramList: any[]) {
  if (!paramList || paramList.length === 0) return '';

  // 如果只有一个项且 code 为空，说明它可能就是原始 JSON 字符串存储的
  if (paramList.length === 1 && !paramList[0].code) {
    return paramList[0].value || '';
  }

  const obj: Record<string, any> = {};
  paramList.forEach((item) => {
    if (item.code) {
      try {
        // 尝试解析值，如果是合法的 JSON（如数组、对象、数字、布尔等）
        obj[item.code] = JSON.parse(item.value);
      } catch (e) {
        // 否则视为普通字符串
        obj[item.code] = item.value;
      }
    }
  });

  return JSON.stringify(obj, null, 2);
}

export const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-500',
  POST: 'text-blue-500',
  PUT: 'text-orange-500',
  DELETE: 'text-red-500',
  PATCH: 'text-purple-500',
  HEAD: 'text-slate-500',
  OPTIONS: 'text-teal-500',
};

// 避免循环依赖，只定义简单的类型或使用 any，或者从 context 定义处导入但需小心
// 这里简单定义 string 映射
export const METHOD_MAP: Record<string, number> = {
  GET: 1,
  POST: 2,
  PUT: 3,
  DELETE: 4,
  PATCH: 5,
};

export const METHOD_MAP_REVERSE: Record<number, string> = {
  1: 'GET',
  2: 'POST',
  3: 'PUT',
  4: 'DELETE',
  5: 'PATCH',
};

export const BODY_MODE_MAP: Record<string, number> = {
  none: 1,
  'application/json': 2,
  'application/x-www-form-urlencoded': 3,
  'multipart/form-data': 4,
};

export const BODY_MODE_MAP_REVERSE: Record<number, any> = {
  1: 'none',
  2: 'application/json',
  3: 'application/x-www-form-urlencoded',
  4: 'multipart/form-data',
};
