import type { PaginationDataDto } from '@/types/pagination';
import { httpRequest } from '@/utils/request.ts';
import { message } from '@teamhelper/ui';
import i18n from '@/i18n';
import type { IKnowledgeDatasetsDto } from '../KnowledgeDetail/server';

export interface IKnowledgeDatasetsMetaDataParams {
  /**
   * 数据集id
   */
  dataset_id: number;
}

export interface IKnowledgeDatasetsMetaDataDto {
  /**
   * 是否自动生成补充索引
   */
  auto_extend_index: boolean;
  /**
   * 索引增强：是否对图片自动索引
   */
  auto_image_index: boolean;
  /**
   * 最大分块大小
   */
  chunk_size: number;
  /**
   * 创建日期
   */
  create_time: string;
  /**
   * 数据集id
   */
  dataset_id: number;
  /**
   * 数据类型：0 = 文件夹，1=FILE文件，2=IMAGE图片，3=空白数据集
   */
  dataset_type: number;
  /**
   * PDF 增强解析模式枚举：
   * 100:Doc2x模式
   * 200:DeepDoc模式
   * 300:Native模式
   * 400:MinerU模式
   * 500:VLM模式
   */
  pdf_handle_type: 100 | 200 | 300 | 400 | 500;
  /**
   * 来源大小，单位：KB
   */
  file_size: number;
  /**
   * 原文文档下载地址
   */
  file_url: string;
  /**
   * 索引增强：是否将标题加入索引
   */
  include_title_index: boolean;
  /**
   * 索引块大小
   */
  index_size: number;
  /**
   * 修改日期
   */
  last_modified_time: string;
  /**
   * 数据集名称
   */
  name: string;
  /**
   * 处理方式：1=分块存储，2=问答提取，3=图片处理
   */
  processing_mode: number;
  /**
   * 原文长度
   */
  text_size: number;
}

/**
 * 查询元数据
 * @param params
 * @returns
 */
export const knowledgeDatasetsMetaDataApi = async (
  params: IKnowledgeDatasetsMetaDataParams,
) => {
  let result = {} as IKnowledgeDatasetsMetaDataDto;

  try {
    const dtoResult = await httpRequest.get<IKnowledgeDatasetsMetaDataDto>({
      url: `/knowledge-bases/dataset/${params?.dataset_id}/metadata`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IKnowledgeDatasetsChunkImagesParams {
  /**
   * 分块ID
   * = null：
   * 新增分块并存储，解析图片，再做分块，向量化并存储
   * 这种情况，会传图片列表，且必须要传
   * != null：
   * 更新分块的图片描述字段（即answer字段），再删除现有所有向量数据，并重新对描述字段进行分块并向量化存储
   * 这种情况，不会传图片列表
   */
  chunk_id: number | null;
  /**
   * 自定义索引列表
   * chunkId = null 时，忽略该字段
   * chunkId != null 时，要传，可为空
   */
  custom_vectors?: ICustomVector[];
  /**
   * 图片描述
   * chunkId = null 时，忽略该字段
   * chunkId != null 时，必须要传
   */
  image_desc?: string;
  /**
   * 图片列表
   * chunkId = null 时，必需要传
   * chunkId != null 时，忽略该字段
   */
  images?: string[];
  /**
   * 需要删除的自定义索引id，即vector_id
   */
  remove_ids?: number[];
}

export interface ICustomVector {
  /**
   * 自定义索引内容
   */
  content: string;
  /**
   * 索引id，如果是更新，则需要传，新增不需要传
   */
  id: number | null;
}

/**
 * 图片数据集-增加图片/新增数据索引
 * @param dataset_id
 * @param params
 * @returns
 */
export const knowledgeDatasetsChunkImagesApi = async (
  dataset_id: number | null,
  params: IKnowledgeDatasetsChunkImagesParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/${dataset_id}/chunk/images`,
      data: params,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    const msg = !params?.chunk_id
      ? i18n.t('knowledge:message.addImageSuccess')
      : i18n.t('knowledge:message.updateSuccess');
    message.success({
      content: msg,
      closeButton: true,
    });
  }

  return result;
};

export interface IKnowledgeDatasetsChunksParams {
  /**
   * 搜索关键词
   */
  keyword?: string;
  /**
   * 起始页，从0开始，默认为0
   */
  page?: number;
  /**
   * 每页显示数据量，默认为10
   */
  size?: number;
}

export interface IKnowledgeDatasetsChunksDto {
  /**
   * 答案; mode = 2/3
   * mode = 2: 答案
   * mode = 3: 图片描述
   */
  answer?: string;
  /**
   * 分块ID
   */
  chunk_id?: number;
  /**
   * 分块内容:mode = 1
   */
  content?: string;
  /**
   * 图片预览URL; mode = 3
   */
  image_preview_url: string;
  /**
   * 分块模式,1=普通分块,2=QA;3=图片处理
   */
  mode?: 1 | 2 | 3;
  /**
   * 问题; mode = 2/3
   * mode = 2: 问题
   * mode = 3: 图片URL
   */
  question?: string;
  /**
   * 数据集大小
   * 文本数据集：分块内容大小，字数
   * 图片数据集：图片大小，字节数
   */
  size?: number;
}

export type IKnowledgeDatasetsChunksDtoList = IKnowledgeDatasetsChunksDto[];

export interface IKnowledgeDatasetsChunksDtoWrap {
  /**
   * 分块列表
   */
  data: PaginationDataDto<IKnowledgeDatasetsChunksDto>;
  /**
   * 向量[索引]数量
   */
  vector_size: number;
}

/**
 * 分页查询数据集分块列表
 * @param dataset_id
 * @param params
 * @returns
 */
export const knowledgeDatasetsChunksApi = async (
  dataset_id: number,
  params: IKnowledgeDatasetsChunksParams,
) => {
  let result = {} as IKnowledgeDatasetsChunksDtoWrap;

  try {
    const dtoResult = await httpRequest.get<IKnowledgeDatasetsChunksDtoWrap>({
      url: `/knowledge-bases/dataset/${dataset_id}/chunks`,
      data: params,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IKnowledgeBasesDatasetsChunksDto {
  /**
   * 答案; mode = 2/3
   * mode = 2: 答案
   * mode = 3: 图片描述
   */
  answer: string;
  /**
   * 分块内容:mode = 1
   */
  content: string;
  /**
   * 图片预览URL; mode = 3
   */
  image_preview_url: string;
  /**
   * 分块模式,1=普通分块,2=QA;3=图片处理
   */
  mode: number;
  /**
   * 问题; mode = 2/3
   * mode = 2: 问题
   * mode = 3: 图片URL
   */
  question: string;
  vectors: IChunksVector[];
}

export interface IChunksVector {
  /**
   * 向量内容
   */
  content?: string;
  /**
   * 向量类型 1:默认索引,2:自定义索引;3:摘要索引；4:推测问题索引；5:图片索引
   */
  type?: 1 | 2 | 3 | 4 | 5;
  /**
   * 向量id，更新需要传
   */
  vector_id: number;
}

/**
 * 查询数据分块详情
 * @param chunk_id
 * @returns
 */
export const knowledgeBasesDatasetsChunksApi = async (
  chunk_id: number | null,
) => {
  let result = {} as IKnowledgeBasesDatasetsChunksDto;

  try {
    const dtoResult = await httpRequest.get<IKnowledgeBasesDatasetsChunksDto>({
      url: `/knowledge-bases/dataset/chunks/${chunk_id}`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface IKnowledgeDatasetsChunkTextsParams {
  /**
   * 答案，仅当processMode为QA_EXTRACT时必填
   */
  answer: string;
  /**
   * 分块ID,如果不传，则是在分块数据中新增索引/或者编辑分块数据（分块弹框中新增自定义索引并保存）
   * 传分块ID，需要将该chunk的向量数据先全部删除（在分块列表页面点击插入）
   */
  chunk_id: number | null;
  /**
   * 内容，仅当processMode为CHUNK_STORE时必填
   */
  content: string;
  /**
   * 索引列表，这里的向量数据，都是自定义
   */
  custom_vectors: ICustomVector[];
  /**
   * 处理模式枚举
   * 1 - 分块存储（常规模式）
   * 2 - 问答对提取（QA模式）
   */
  process_mode: 1 | 2;
  /**
   * 问题，仅当processMode为QA_EXTRACT时必填
   */
  question: string;
  /**
   * 需要删除的自定义索引id，即vector_id
   */
  remove_ids?: number[];
}

/**
 * 更新文本数据集分块
 * @param dataset_id
 * @param params
 * @returns
 */
export const knowledgeDatasetsChunkTextsApi = async (
  dataset_id: number | null,
  params: IKnowledgeDatasetsChunkTextsParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/${dataset_id}/chunk/texts`,
      data: params,
    });
    result = Boolean(dtoResult?.data);
  } catch (error) {}

  if (result) {
    const msg = !params?.chunk_id
      ? i18n.t('knowledge:message.createSuccess')
      : i18n.t('knowledge:message.updateSuccess');
    message.success({
      content: msg,
      closeButton: true,
    });
  }

  return result;
};

/**
 * 删除数据集分块
 * @param chunk_id
 * @returns
 */
export const deleteKnowledgeDatasetsChunkApi = async (
  chunk_id: number | null,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/chunks/${chunk_id}/delete`,
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

export type IKnowledgeDatasetsStatusDto = IKnowledgeDatasetsDto['status'];

/**
 * 获取数据集状态
 * @param dataset_id
 * @returns
 */
export const queryKBDatasetStatusApi = async (dataset_id: number | null) => {
  let result = 1 as IKnowledgeDatasetsStatusDto;

  try {
    const dtoResult = await httpRequest.get<{
      status: IKnowledgeDatasetsStatusDto;
    }>({
      url: `/knowledge-bases/dataset/${dataset_id}/status`,
    });
    result = dtoResult?.data?.status ?? 1;
  } catch (error) {}

  return result;
};
