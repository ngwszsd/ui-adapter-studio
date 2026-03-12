import i18n from '@/i18n';
import type { PaginationDataDto } from '@/types/pagination';
import { httpRequest } from '@/utils/request.ts';
import { listToTree } from '@/lib/utils.ts';
import { message, type TreeNode } from '@teamhelper/ui';
import { filterDescendants } from '@/pages/ManageDetail/MenuPage/Knowledge/knowledgeBaseUtils.ts';

export interface IKnowledgeBasesParams {
  /**
   * 名称/描述关键字搜索
   */
  keyword?: string;
  /**
   * 页码
   */
  page?: number;
  /**
   * 父级ID（筛选指定文件夹下的内容，根目录传 空）
   */
  parent_id?: number | null;
  /**
   * 每页数量
   */
  size?: number;
}

export interface IKnowledgeBasesDto {
  /**
   * 知识库头像url
   */
  avatar: string;
  /**
   * 创建人ID
   */
  created_by: string;
  /**
   * 创建时间
   */
  created_date: string;
  /**
   * 描述/简介
   */
  description?: string;
  /**
   * 索引模型ID
   */
  embedding_model_id?: number;
  /**
   * 索引模型名称
   */
  embedding_model_name?: string;
  /**
   * 主键ID
   */
  id: number | null;
  /**
   * 名称
   */
  name: string;
  /**
   * 父级ID
   */
  parent_id?: number | null;
  /**
   * 类型：1=SPACE, 2=FOLDER, 3=FILE
   */
  type: 1 | 2 | 3;
  /**
   * 头像
   */
  user_icon: string;
}

export type IKnowledgeBasesDtoList = IKnowledgeBasesDto[];

/**
 * 查询知识库列表
 * @param params
 * @returns
 */
export const knowledgeBasesApi = async (params: IKnowledgeBasesParams) => {
  let result = [] as IKnowledgeBasesDtoList;

  try {
    const dtoResult = await httpRequest.get<
      PaginationDataDto<IKnowledgeBasesDto>
    >({
      url: `/knowledge-bases`,
      data: params,
    });
    result = dtoResult?.data?.content || [];
  } catch (error) {}

  return result;
};

/**
 * 删除知识库
 * @param params
 * @returns
 */
export const deleteKnowledgeBasesApi = async (
  knowledge_base_id: number | null,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/delete?knowledge_base_id=${knowledge_base_id}`,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    message.success({
      content: i18n.t('knowledge:message.deleteSuccess'),
      closeButton: true,
    });
  }

  return result;
};

export interface IKnowledgeBasesGroupListDto {
  /**
   * 主键ID
   */
  id: string;
  /**
   * 文件夹名称
   */
  name: string;
  /**
   * 父节点ID
   */
  parent_id: string;
}

export type IKnowledgeBasesGroupListDtoList = IKnowledgeBasesGroupListDto[];

/**
 * 知识库文件夹树列表
 * @returns
 */
export const knowledgeBasesGroupListApi = async (
  moveResourceId: number | undefined,
) => {
  let result = [] as IKnowledgeBasesGroupListDtoList;

  try {
    const dtoResult = await httpRequest.get<IKnowledgeBasesGroupListDtoList>({
      url: `/knowledge-bases/group/list`,
    });
    result = [...result, ...dtoResult?.data];

    if (
      Array.isArray(result) &&
      result.length &&
      typeof moveResourceId === 'number'
    ) {
      result = filterDescendants(result, moveResourceId);
    }
  } catch (error) {}

  const resultVo = result.map((item) => {
    return {
      key: item?.id,
      title: item?.name,
      ...item,
    };
  });

  const tree = listToTree(resultVo, { rootParentValues: [''] });
  const list = [
    {
      key: '',
      title: i18n.t('knowledge:top.rootDir'),
      children: tree || [],
    },
  ] as TreeNode[];

  return list;
};

export interface ICreateKnowledgeBasesParams {
  /**
   * 知识库头像ObjectKey
   */
  avatar?: string;
  /**
   * 描述/简介
   */
  description?: string;
  /**
   * 索引模型ID
   */
  embedding_model_id?: number;
  /**
   * 图片理解模型ID
   */
  image_model_id?: number;
  /**
   * 名称（知识库/文件夹）
   */
  name: string;
  /**
   * 父级目录ID
   */
  parent_id?: number | null;
  /**
   * 文本理解模型ID
   */
  text_model_id?: number;
  /**
   * 创建类型：
   * 1=创建通用知识库；
   * 2=在知识库下创建文件夹
   */
  type: 1 | 2;
}

/**
 * 创建知识库/文件夹
 * @param params
 * @returns
 */
export const createKnowledgeBasesApi = async (
  params: ICreateKnowledgeBasesParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/create`,
      data: params,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    message.success({
      content: i18n.t('knowledge:message.createSuccess'),
      closeButton: true,
    });
  }

  return result;
};

export interface IGetModelsParams {
  /**
   * 模型名称，全模糊匹配
   */
  name?: string;
  /**
   * 模型类型：
   * 1 - 文本模型
   * 2 - 图像模型
   * 3 - 索引模型
   * 4 - 重排模型
   *
   * 多个模型类型用逗号分隔，例如：1,2,3
   */
  type?: string;
}

export interface IGetModelsDto {
  /**
   * 模型id
   */
  id?: number;
  /**
   * 模型名称
   */
  model_name?: string;
  /**
   * 模型类型，参考入参
   */
  model_type?: number;
  /**
   * 模型名称[展示]
   */
  name: string;
}

export type IGetModelsDtoList = IGetModelsDto[];

/**
 * 获取某个模型
 * @param params
 * @returns
 */
export const getModelsApi = async (params: IGetModelsParams) => {
  let result = [] as IGetModelsDtoList;

  try {
    const dtoResult = await httpRequest.get<IGetModelsDtoList>({
      url: `/llm-models`,
      data: params,
    });
    result = dtoResult?.data || [];
  } catch (error) {}

  return result;
};

export interface IUpdateKnowledgeBasesParams {
  /**
   * 知识库介绍/简介
   */
  description?: string;
  /**
   * id
   */
  id: number | null;
  /**
   * 知识库名称
   */
  name?: string;
  /**
   * 知识库头像ObjectKey
   */
  avatar?: string;
}

/**
 * 编辑知识库信息
 * @param params
 * @returns
 */
export const updateKnowledgeBasesApi = async (
  params: IUpdateKnowledgeBasesParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/update`,
      data: params,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    message.success({
      content: i18n.t('knowledge:message.updateSuccess'),
      closeButton: true,
    });
  }

  return result;
};

export interface IQueryKnowledgeBasesDto {
  /**
   * 知识库头像url
   */
  avatar: string;
  /**
   * 描述
   */
  description: string;
  /**
   * 索引模型ID
   */
  embedding_model_id: number;
  /**
   * 索引模型名称
   */
  embedding_model_name: string;
  /**
   * id
   */
  id: number | null;
  /**
   * 图片模型ID
   */
  image_model_id: number;
  /**
   * 图片模型名称
   */
  image_model_name: string;
  /**
   * 名称
   */
  name: string;
  /**
   * 文本模型ID
   */
  text_model_id: number;
  /**
   * 文本模型名称
   */
  text_model_name: string;
  /**
   * 类型：1=SPACE, 2=FOLDER, 3=FILE
   */
  type: 1 | 2 | 3;
}

/**
 * 查询知识库详情
 * @param knowledge_id
 * @returns
 */
export const queryKnowledgeBasesApi = async (knowledge_id: number | null) => {
  let result = {} as IQueryKnowledgeBasesDto;

  try {
    const dtoResult = await httpRequest.get<IQueryKnowledgeBasesDto>({
      url: `/knowledge-bases/${knowledge_id}`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IMoveKnowledgeBasesParams {
  /**
   * 待移动的知识节点 ID，可为文件夹或具体文件，与知识列表接口中的知识节点 ID 字段保持一致。
   */
  source_knowledge_base_id: number | null;
  /**
   * 目标父级目录 ID：移动到根目录时约定传 -1，其余情况传目标文件夹在知识库中的节点 ID。
   */
  target_knowledge_base_id: number;
}

/**
 * 移动知识库
 * @param params
 * @returns
 */
export const moveKnowledgeBasesApi = async (
  params: IMoveKnowledgeBasesParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/move`,
      data: params,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    message.success({
      content: i18n.t('knowledge:message.operationSuccess'),
      closeButton: true,
    });
  }

  return result;
};

export interface IGetKnowledgeBasesPathParams {
  /**
   * 知识库ID
   */
  knowledge_id: number | null;
}

export interface IGetKnowledgeBasesPathDto {
  /**
   * 知识库id
   */
  id: number;
  /**
   * 知识库名称（文件夹类型）
   */
  name: string;
  /**
   * 父级目录id
   */
  parent_id: number;
}

export type IGetKnowledgeBasesPathDtoList = Array<IGetKnowledgeBasesPathDto>;

/**
 * 获取知识库顶部路径path
 * @param params
 * @returns
 */
export const getKnowledgeBasesPathApi = async (
  params: IGetKnowledgeBasesPathParams,
) => {
  let result = [] as IGetKnowledgeBasesPathDtoList;

  try {
    const dtoResult = await httpRequest.get<IGetKnowledgeBasesPathDtoList>({
      url: `/knowledge-bases/${params?.knowledge_id}/path`,
    });
    result = dtoResult?.data || [];
  } catch (error) {}

  return result;
};
