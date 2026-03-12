import { type SEARCH_SCORE_TYPE } from '@/constants/knowledgeBase.ts';
import type { IKnowledgeBasesSearchDtoScore } from '@/pages/ManageDetail/MenuPage/Knowledge/KnowledgeDetail/server.ts';
import {
  differenceInSeconds,
  format,
  isSameYear,
  isToday,
  isYesterday,
} from 'date-fns';

export const kbFormatScoreFn = (score: IKnowledgeBasesSearchDtoScore[]) => {
  if (!Array.isArray(score)) {
    return {
      primaryScore: undefined,
      secondaryScore: [],
    };
  }

  let rrfScore: IKnowledgeBasesSearchDtoScore | undefined = undefined;
  let reRankScore: IKnowledgeBasesSearchDtoScore | undefined = undefined;
  let embeddingScore: IKnowledgeBasesSearchDtoScore | undefined = undefined;
  let fullTextScore: IKnowledgeBasesSearchDtoScore | undefined = undefined;

  score.forEach((item) => {
    item.value = Number(item?.value) || 0;

    const type = String(item?.type) as SEARCH_SCORE_TYPE;
    if (type === '1') {
      rrfScore = item;
    } else if (type === '2') {
      reRankScore = item;
    } else if (type === '3') {
      embeddingScore = item;
    } else if (type === '4') {
      fullTextScore = item;
    }
  });

  const primaryScore = (rrfScore ||
    reRankScore ||
    embeddingScore ||
    fullTextScore) as unknown as IKnowledgeBasesSearchDtoScore;
  const secondaryScore = [
    rrfScore,
    reRankScore,
    embeddingScore,
    fullTextScore,
  ].filter(
    // @ts-ignore
    (item) => item && primaryScore && item?.type !== primaryScore?.type,
  ) as unknown as IKnowledgeBasesSearchDtoScore[];

  return {
    primaryScore,
    secondaryScore,
  };
};

export const formatTimeToChatTime = (time: string) => {
  const now = new Date();
  let target = new Date(time);

  // 兼容 Safari new Date('YYYY-MM-DD HH:mm:ss') 返回 Invalid Date 的问题
  if (isNaN(target.getTime())) {
    target = new Date(time.replace(/-/g, '/'));
  }

  // 如果传入时间小于60秒，返回刚刚
  if (differenceInSeconds(now, target) < 60) {
    return '刚刚';
  }

  // 如果时间是今天，展示几时:几分
  //用#占位，i18n生效后replace成:
  if (isToday(target)) {
    return format(target, 'HH:mm');
  }

  // 如果是昨天，展示昨天
  if (isYesterday(target)) {
    return '昨天';
  }

  // 如果是今年，展示某月某日
  if (isSameYear(now, target)) {
    return format(target, 'MM-dd');
  }

  // 如果是更久之前，展示某年某月某日
  return format(target, 'yyyy-M-d');
};

export function filterDescendants<T extends Record<string, any>>(
  list: T[],
  targetId: number | string,
  options?: { idKey?: string; parentIdKey?: string },
): T[] {
  const idKey = options?.idKey ?? 'id';
  const parentIdKey = options?.parentIdKey ?? 'parent_id';

  // Build adjacency map
  const parentMap = new Map<string | number, (string | number)[]>();
  list.forEach((item) => {
    const pId = item[parentIdKey];
    const cId = item[idKey];
    if (pId !== undefined && pId !== null) {
      if (!parentMap.has(pId)) {
        parentMap.set(pId, []);
      }
      parentMap.get(pId)?.push(cId);
    }
  });

  const excludeIds = new Set<string | number>();
  excludeIds.add(targetId);

  const queue = [targetId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = parentMap.get(currentId);
    if (children) {
      children.forEach((childId) => {
        if (!excludeIds.has(childId)) {
          excludeIds.add(childId);
          queue.push(childId);
        }
      });
    }
  }

  return list.filter((item) => !excludeIds.has(item[idKey]));
}
