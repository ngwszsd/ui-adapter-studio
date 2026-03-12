import { listToTree } from '@/lib/utils.ts';
import type { PaginationDataDto } from '@/types/pagination.ts';
import { httpRequest } from '@/utils/request.ts';
import { message, type TreeNode } from '@teamhelper/ui';
import i18n from '@/i18n';
import { filterDescendants } from '@/pages/ManageDetail/MenuPage/Knowledge/knowledgeBaseUtils.ts';

export interface IKnowledgeDatasetsParams {
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

export interface IKnowledgeDatasetsDto {
  /**
   * 是否激活
   */
  activated: boolean;
  /**
   * 分块数量，数据被分割成的块数
   */
  chunk_count?: number;
  /**
   * 配置ID，关联的配置项唯一标识
   */
  config_id?: number;
  /**
   * 创建时间
   */
  create_time: string;
  /**
   * 数据集类型，数据的类型，例如文本、图像等
   * 数据类型：0 = 文件夹，1=FILE文件，2=IMAGE图片，3=空白数据集
   */
  data_type?: 0 | 1 | 2;
  /**
   * 描述，数据集的详细描述信息
   */
  description?: string;
  /**
   * 数据集id，数据集id
   */
  id: number;
  /**
   * 名称，数据集的名称
   */
  name?: string;
  /**
   * 父级ID，数据集所属文件夹的唯一标识
   */
  parent_id?: number;
  /**
   * 处理模式，数据处理的方式或模式
   * 处理方式：1=分块存储，2=问答提取 ，3=图片处理
   */
  processing_mode?: 1 | 2 | 3;
  /**
   * 状态，数据集的当前状态，如处理中、已完成等
   * 状态：0未训练，1训练中，2已就绪，3失败
   */
  status?: 0 | 1 | 2 | 3;
  /**
   * 存储键，数据在存储系统中的键值
   */
  storage_key?: string;
  /**
   * 更新时间
   */
  update_time: string;
  /**
   * 正在训练的分块数量
   */
  training_amount: number;
}

export type IKnowledgeDatasetsDtoList = IKnowledgeDatasetsDto[];

/**
 * 查询数据集列表
 * @param params
 * @returns
 */
export const knowledgeDatasetsApi = async (
  knowledge_id: number | null,
  params: IKnowledgeDatasetsParams,
) => {
  let result = {} as PaginationDataDto<IKnowledgeDatasetsDto>;

  try {
    const dtoResult = await httpRequest.get<
      PaginationDataDto<IKnowledgeDatasetsDto>
    >({
      url: `/knowledge-bases/${knowledge_id}/datasets`,
      data: params,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IDeleteKnowledgeDatasetsParams {
  /**
   * 数据集ID集合，多个以英文逗号分隔
   */
  dataset_ids: string;
}

/**
 * 数据集删除
 * @param params
 * @returns
 */
export const deleteKnowledgeDatasetsApi = async (
  params: IDeleteKnowledgeDatasetsParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/delete?dataset_ids=${params?.dataset_ids || ''}`,
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

export interface IRenameKnowledgeDatasetsParams {
  /**
   * id
   */
  dataset_id: number | null;
  /**
   * 名称
   */
  name?: string;
}

/**
 * 数据集-重命名
 * @param params
 * @returns
 */
export const renameKnowledgeDatasetsApi = async (
  params: IRenameKnowledgeDatasetsParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/rename`,
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

export interface IMoveKnowledgeDatasetsParams {
  /**
   * id
   */
  dataset_id: number;
  /**
   * 父级目录ID，根目录留空
   */
  parent_id?: string;
}

/**
 * 数据集-移动
 * @param params
 * @returns
 */
export const moveKnowledgeDatasetsApi = async (
  params: IMoveKnowledgeDatasetsParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/move`,
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

export interface IGetKnowledgeBasesDatasetPathParams {
  /**
   * 目录ID，即类型为文件夹的数据集
   */
  folder_id: number | null;
}

export interface IGetKnowledgeBasesDatasetPathDto {
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

export type IGetKnowledgeBasesDatasetPathDtoList =
  Array<IGetKnowledgeBasesDatasetPathDto>;

/**
 * 获取数据集顶部路径
 * @param params
 * @returns
 */
export const getKnowledgeBasesDatasetPathApi = async (
  params: IGetKnowledgeBasesDatasetPathParams,
) => {
  let result = [] as IGetKnowledgeBasesDatasetPathDtoList;

  try {
    const dtoResult =
      await httpRequest.get<IGetKnowledgeBasesDatasetPathDtoList>({
        url: `/knowledge-bases/dataset/${params?.folder_id}/path`,
      });
    result = dtoResult?.data || [];
  } catch (error) {}

  return result;
};

export interface IKnowledgeBasesDatasetStatusParams {
  /**
   * 数据集ID
   */
  dataset_id: number;
}

/**
 * 禁用/启用数据集
 * @param params
 * @returns
 */
export const knowledgeBasesDatasetStatusApi = async (
  params: IKnowledgeBasesDatasetStatusParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/${params?.dataset_id}/switch-status`,
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

export interface IDatasetConfig {
  /**
   * 自定义分块模式，自定义分块模式;1-按段落分块;2-按长度分块;3-按指定分隔符分块
   */
  custom_chunk_mode?: 1 | 2 | 3;
  /**
   * 索引添加标题，索引是否添加标题
   */
  index_add_title?: boolean;
  /**
   * 索引自动补全，索引是否自动补全
   */
  index_auto_fill?: boolean;
  /**
   * 索引自动识别图片，索引是否自动识别图片
   */
  index_auto_image?: boolean;
  /**
   * 长度分块大小，按长度分块的块大小
   */
  length_chunk_size?: number;
  /**
   * 长度索引大小，按长度分块的索引大小
   */
  length_index_size?: number;
  /**
   * 长度问答提示，按长度分块的问答提示词
   */
  length_qa_prompt?: string;
  /**
   * 段落索引大小，段落索引大小
   */
  paragraph_index_size?: number;
  /**
   * 段落最大块大小，段落最大块大小
   */
  paragraph_max_chunk_size?: number;
  /**
   * 段落最大深度，段落最大嵌套深度
   */
  paragraph_max_depth?: number;
  /**
   * 段落检测，段落模型是否启用段落检测
   * 1-自动
   * 2-禁用
   * 3-强制处理
   */
  paragraph_model_paragraph_detect?: 1 | 2 | 3;
  /**
   * 段落问答提示，段落问答提示词
   */
  paragraph_qa_prompt?: string;
  /**
   * PDF 增强解析模式，PDF 增强解析模式枚举：
   * 100:Doc2x模式
   * 200:DeepDoc模式
   * 300:Native模式
   * 400:MinerU模式
   * 500:VLM模式
   */
  pdf_handle_type?: 100 | 200 | 300 | 400 | 500;
  /**
   * 处理模式，处理模式;1-分块存储;2-问答对提取
   */
  process_mode?: 1 | 2;
  /**
   * 处理策略，处理策略;1-默认；2-自定义
   */
  process_strategy?: 1 | 2;
  /**
   * 自定义分隔符，自定义分隔符
   */
  separator_custom_separator?: string;
  /**
   * 分隔符索引大小，分隔符索引大小
   */
  separator_index_size?: number;
  /**
   * 分隔符问答提示，分隔符问答提示词
   */
  separator_qa_prompt?: string;
  /**
   * 分隔符类型，分隔符类型;
   * 1 - 不设置
   * 2 - 1个换行符
   * 3 - 2个换行符
   * 4- 句号
   * 5- 感叹号
   * 6 - 问号
   * 7 - 分号
   * 8 - 6个等号
   * 9 - 自定义分隔符
   */
  separator_separator_type?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /**
   * 切分条件长度，切分条件长度
   */
  split_condition_length?: number;
  /**
   * 切分条件类型，切分条件类型;1-原文长度大于;2-原文长度大于模型最大上下文70%;3-强制分块
   */
  split_condition_type?: 1 | 2 | 3;
}

export interface IDatasetFile {
  /**
   * 数据集名称，即文件名称
   */
  name: string;
  /**
   * 上传的文件objectKey
   * 文本数据集：单个
   * 图片数据集：用英文分号间隔多个图片key
   * 文件夹：空
   */
  object_key?: string;
}

export interface ISaveKnowledgeBasesDatasetParams {
  /**
   * 数据集配置，数据集配置
   */
  config?: IDatasetConfig;
  /**
   * 数据集类型，数据集类型：0-文本夹，1-文本数据集，2-图片数据集，3-空数据集
   */
  dataset_type: 0 | 1 | 2 | 3;
  /**
   * 知识库ID，关联知识库id
   */
  knowledge_base_id: number | null;
  /**
   * 父级节点id，父级节点id，如无，则传空
   */
  parent_id?: number | null;
  /**
   * 文本：>=1个files对象
   * 图片、文件：有且仅有一个
   */
  files: IDatasetFile[];
}

/**
 * 创建数据集
 * @param params
 * @returns
 */
export const saveKnowledgeBasesDatasetApi = async (
  params: ISaveKnowledgeBasesDatasetParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/save`,
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

export interface IKnowledgeBasesDatasetTrainingStepParams {
  /**
   * 数据集id
   */
  dataset_id: number | null;
}

export interface IKnowledgeBasesDatasetTrainingStepDto {
  /**
   * 数据集ID
   */
  dataset_id?: number;
  /**
   * 训练步骤编码
   */
  step_code?: string;
  /**
   * 训练步骤名称
   */
  step_name?: string;
  /**
   * 训练步骤状态0-未训练；1-训练中；2-已就绪;3-训练失败，如果为空，表示还未到该步骤
   */
  step_status?: 0 | 1 | 2 | 3;
}

export type IKnowledgeBasesDatasetTrainingStepDtoList =
  IKnowledgeBasesDatasetTrainingStepDto[];

/**
 * 训练步骤列表
 * @param params
 * @returns
 */
export const knowledgeBasesDatasetTrainingStepsApi = async (
  params: IKnowledgeBasesDatasetTrainingStepParams,
) => {
  let result = [] as IKnowledgeBasesDatasetTrainingStepDtoList;

  try {
    const dtoResult =
      await httpRequest.get<IKnowledgeBasesDatasetTrainingStepDtoList>({
        url: `/knowledge-bases/dataset/${params.dataset_id}/training-steps`,
      });
    result = dtoResult?.data || [];
  } catch (error) {}

  return result;
};

export interface IKnowledgeBasesDatasetErrorsParams {
  /**
   * 数据集id
   */
  dataset_id: number | null;
}

export interface IKnowledgeBasesDatasetErrorsDto {
  /**
   * 主键
   */
  id?: number;
  /**
   * 错误信息
   */
  message?: string;
  /**
   * 状态（2：重试中；1：失败;3: 重试成功；4：重试失败）.
   */
  status?: 1 | 2 | 3 | 4;
  /**
   * 训练步骤名称，参考【训练步骤列表】接口
   */
  step_name: string;
  /**
   * 分块id
   */
  trunk_id?: number;
}

export type IKnowledgeBasesDatasetErrorsDtoList =
  IKnowledgeBasesDatasetErrorsDto[];

/**
 * 异常列表
 * @param params
 * @returns
 */
export const knowledgeBasesDatasetErrorsApi = async (
  params: IKnowledgeBasesDatasetErrorsParams,
) => {
  let result = [] as IKnowledgeBasesDatasetErrorsDtoList;

  try {
    const dtoResult =
      await httpRequest.get<IKnowledgeBasesDatasetErrorsDtoList>({
        url: `/knowledge-bases/dataset/${params?.dataset_id}/errors`,
      });
    result = dtoResult?.data || [];
  } catch (error) {}

  return result;
};

export interface IUpdateKnowledgeBasesModelsParams {
  /**
   * 知识库id
   */
  knowledge_id: number | null;
  /**
   * 要修改的模型id
   */
  model_id: number;
  /**
   * 模型类型
   * 1 - 文本模型
   * 2 - 图像模型
   * 3 - 索引模型
   */
  model_type?: 1 | 2 | 3;
}

/**
 * 修改知识库模型接口
 * @param params
 * @returns
 */
export const updateKnowledgeBasesModelsApi = async (
  params: IUpdateKnowledgeBasesModelsParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/${params?.knowledge_id}/models/${params?.model_id}?model_type=${params?.model_type}`,
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

export interface IKnowledgeBasesFoldersParams {
  /**
   * 知识库id
   */
  knowledge_base_id: number | null;
}

export interface IKnowledgeBasesFoldersDto {
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

export type IKnowledgeBasesFoldersDtoList = IKnowledgeBasesFoldersDto[];

/**
 * 数据集文件夹列表
 * @returns
 */
export const knowledgeBasesFoldersApi = async (
  moveResourceId: number | undefined,
  params: IKnowledgeBasesFoldersParams,
) => {
  let result = [] as IKnowledgeBasesFoldersDtoList;

  try {
    const dtoResult = await httpRequest.get<IKnowledgeBasesFoldersDtoList>({
      url: `/knowledge-bases/dataset/${params?.knowledge_base_id}/folders`,
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

/**
 * 删除数据集训练错误
 * @param error_id
 * @returns
 */
export const deleteKnowledgeBasesDatasetErrorsApi = async (
  error_id: number | null,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/errors/${error_id}/delete`,
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

/**
 * 重试数据集训练错误
 * @param error_id
 * @returns
 */
export const retryKnowledgeBasesDatasetErrorsApi = async (
  error_id: number | null,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/errors/${error_id}/retry`,
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

export interface IKnowledgeBasesSearchHistoriesParams {
  /**
   * 分页，开始页码，从0开始，默认为0
   */
  page?: number;
  /**
   * 分页，每页显示条数，默认为10
   */
  size?: number;
}

export interface IKnowledgeBasesSearchHistoriesDto {
  /**
   * 历史id
   */
  id: number;
  /**
   * 查询时间
   */
  query_time: string;
  /**
   * 请求数据，请求时发送的JSON数据
   */
  request_json?: string;
  request_obj?: IKnowledgeBasesSearchParams;
  /**
   * 响应数据，返回的JSON响应数据
   */
  response_json?: string;
  response_obj?: IKnowledgeBasesSearchDto;
}

/**
 * 查询测试历史接口
 * @param knowledge_id
 * @param params
 * @returns
 */
export const knowledgeBasesSearchHistoriesApi = async (
  knowledge_id: number | null,
  params: IKnowledgeBasesSearchHistoriesParams,
) => {
  let result = {} as PaginationDataDto<IKnowledgeBasesSearchHistoriesDto>;

  try {
    const dtoResult = await httpRequest.get<
      PaginationDataDto<IKnowledgeBasesSearchHistoriesDto>
    >({
      url: `/knowledge-bases/${knowledge_id}/search-histories`,
      data: params,
    });
    result = dtoResult?.data || {};
    const content = result?.content || [];
    if (Array.isArray(content) && content.length) {
      content.forEach((item) => {
        try {
          item.request_obj = JSON.parse(item?.request_json || '{}');
        } catch (_e) {
          item.request_obj = {} as IKnowledgeBasesSearchParams;
        }

        try {
          item.response_obj = JSON.parse(item?.response_json || '{}');
        } catch (_e) {
          item.response_obj = {} as IKnowledgeBasesSearchDto;
        }
      });
    }
  } catch (error) {}

  return result;
};

export interface IKnowledgeBasesSearchParams {
  /**
   * 问题优化 - 对话背景描述（开启 使用问题优化）
   */
  dataset_search_extension_bg: string;
  /**
   * 问题优化 - AI模型（开启 使用问题优化）
   * 模型ID
   */
  dataset_search_extension_model: number | null;
  /**
   * 是否开启 使用问题优化
   */
  dataset_search_using_extension_query: boolean;
  /**
   * 混合检索时，语义检索的权重
   */
  embedding_weight: number;
  /**
   * 搜索过滤 - 引用上限
   */
  limit: number;
  /**
   * 搜索方式 - 重排模型（开启 结果重排）
   * 重排模型ID
   */
  rerank_model: string;
  /**
   * 搜索方式- 重排权重（开启 结果重排）
   */
  rerank_weight: number;
  /**
   * 搜索方式：
   * 1 - 语义检索
   * 2 - 全文检索
   * 3 - 混合检索
   */
  search_mode: '1' | '2' | '3';
  /**
   * 搜索过滤 - 最低相关度
   */
  similarity: number;
  /**
   * 搜索文本
   */
  text: string;
  /**
   * 是否开启 结果重排
   */
  using_re_rank: boolean;
}

export interface IKnowledgeBasesSearchDto {
  /**
   * 耗时，本次请求处理所花费的时间，格式为时间段，如 '1.2s'
   */
  duration: string;
  /**
   * 问题优化模型名称，问题优化模型名称
   */
  extension_model: string;
  /**
   * 返回数量限制，本次请求最多返回的结果数量
   */
  limit: number;
  /**
   * 结果列表，匹配的文档片段列表
   */
  result: IKnowledgeBasesSearchDtoResult[];
  /**
   * 搜索模式，搜索方式：
   * 1 - 语义检索
   * 2 - 全文检索
   * 3 - 混合检索
   */
  search_mode: 1 | 2 | 3;
  /**
   * 最低相关度，最低相关度
   */
  similarity: number;
  /**
   * 是否使用问题优化，是否使用问题优化
   */
  using_extension: boolean;
  /**
   * 是否使用重排序，指示是否启用了重排序算法来优化结果顺序
   */
  using_re_rank: boolean;
  /**
   * 是否开启最低相关度过滤，是否开启最低相关度过滤
   */
  using_similarity_filter: boolean;
}

export interface IKnowledgeBasesSearchDtoResult {
  /**
   * 回答，回答(如果有该字段，说明是问答对模式，否则是普通分块模式)
   */
  a?: string;
  /**
   * 片段ID，文档片段的唯一标识符
   */
  chunk_id?: number;
  /**
   * 数据集类型，数据的类型，例如文本、图像等
   * 数据类型：0 = 文件夹，1=FILE文件，2=IMAGE图片，3=空白数据集
   */
  data_type: number;
  /**
   * 数据集ID，该片段所属的数据集唯一标识
   */
  dataset_id?: number;
  /**
   * 文件对象键，存储系统中文件的唯一键值，用于定位原始文件
   */
  file_object_key?: string;
  file_url?: string;
  /**
   * 知识库ID，该片段所属的知识库唯一标识
   */
  knowledge_id?: number;
  /**
   * 查询结果，结果
   */
  q?: string;
  /**
   * 评分列表，该片段与查询的相关性评分详情
   */
  score?: IKnowledgeBasesSearchDtoScore[];
  /**
   * 源文件名，该片段来源的原始文件名称
   */
  source_name?: string;
  /**
   * 分词数，该片段经过处理后的分词数量
   */
  tokens?: number;
  /**
   * 更新时间，该片段最后一次更新的时间，格式为ISO8601
   */
  update_time?: string;
}

export interface IKnowledgeBasesSearchDtoScore {
  /**
   * 索引，排名：第一名是0，以此类推
   */
  index: number;
  /**
   * 评分类型，         * 分数类型
   * * 1 - 综合排名
   * * 2 - 结果重排
   * * 3 - 语义检索
   * * 4 - 全文检索
   */
  type: 1 | 2 | 3 | 4;
  /**
   * 评分值，具体的评分数值
   */
  value: number;
}

/**
 * 搜索测试
 * @param knowledge_id
 * @param params
 * @returns
 */
export const knowledgeBasesSearchApi = async (
  knowledge_id: number | null,
  params: IKnowledgeBasesSearchParams,
) => {
  let result = {} as IKnowledgeBasesSearchDto;

  try {
    const dtoResult = await httpRequest.post<IKnowledgeBasesSearchDto>({
      url: `/knowledge-bases/${knowledge_id}/search`,
      data: params,
      timeout: 30 * 1000,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

/**
 * 删除搜索测试历史
 * @param history_id
 * @returns
 */
export const deleteKnowledgeSearchHistoriesApi = async (
  history_id: number | null,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/search-histories/${history_id}/delete`,
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

/**
 * 获取训练异常数量
 * @param dataset_id
 * @returns
 */
export const getKBDatasetErrorCountApi = async (dataset_id: number | null) => {
  let result = 0;

  try {
    const dtoResult = await httpRequest.get<number>({
      url: `/knowledge-bases/dataset/${dataset_id}/error-count`,
    });
    result = dtoResult?.data ?? 0;
  } catch (error) {}

  return result;
};

/**
 * 获取知识库正在训练的chunk数
 * @param knowledge_base_id
 * @returns
 */
export const getKBDatasetChunksTrainingCountApi = async (
  knowledge_base_id: number | null,
) => {
  let result = 0;

  try {
    const dtoResult = await httpRequest.get<number>({
      url: `/knowledge-bases/${knowledge_base_id}/chunks/training-count`,
      showError: false,
      returnFullError: true,
    });
    result = dtoResult?.data ?? 0;
  } catch (error: any) {
    const bool = String(error?.message).includes('1001001');
    if (bool) {
      result = -999;
    }
  }

  return result;
};
