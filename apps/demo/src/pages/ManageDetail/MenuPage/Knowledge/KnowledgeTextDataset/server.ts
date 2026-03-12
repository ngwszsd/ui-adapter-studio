import { httpRequest } from '@/utils/request.ts';
import type { IDatasetConfig } from '../KnowledgeDetail/server';
import { message } from '@teamhelper/ui';
import i18n from '@/i18n';

export interface IKnowledgeDatasetChunksPreviewParams extends IDatasetConfig {
  /**
   * 文件对象键，用于标识存储系统中的文件对象的唯一键值
   */
  file_object_key: string;
}

export interface IKnowledgeDatasetChunksPreviewDto {
  /**
   * 数据块，包含问答对的数据列表
   */
  chunks: IKnowledgeDatasetChunk[];
  /**
   * 总数，返回的数据总条数，表示符合条件的记录数量
   */
  total: number;
}

export interface IKnowledgeDatasetChunk {
  /**
   * 回答，针对问题的对应回答内容
   */
  a: string;
  /**
   * 问题，用户的提问内容
   */
  q: string;
}

/**
 * 数据集分块预览
 * @param params
 * @returns
 */
export const knowledgeDatasetChunksPreviewApi = async (
  knowledge_base_id: number | null,
  params: IKnowledgeDatasetChunksPreviewParams,
) => {
  let result = {} as IKnowledgeDatasetChunksPreviewDto;

  try {
    const dtoResult = await httpRequest.post<IKnowledgeDatasetChunksPreviewDto>(
      {
        url: `/knowledge-bases/dataset/chunks/preview?knowledge_base_id=${knowledge_base_id}`,
        data: params,
        timeout: 10 * 60 * 1000,
        showError: false,
      },
    );
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export type IKnowledgeDatasetTrainingConfigDto = IDatasetConfig;

/**
 * 获取训练参数详情
 * @param dataset_id
 * @returns
 */
export const knowledgeDatasetTrainingConfigApi = async (
  dataset_id: number | null,
) => {
  let result = {} as IKnowledgeDatasetTrainingConfigDto;

  try {
    const dtoResult = await httpRequest.get<IKnowledgeDatasetTrainingConfigDto>(
      {
        url: `/knowledge-bases/dataset/${dataset_id}/training-config`,
      },
    );
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export type IUpdateKnowledgeDatasetTrainingConfigParams = IDatasetConfig;

/**
 * 调整训练参数
 * @param dataset_id
 * @param params
 * @returns
 */
export const updateKnowledgeDatasetTrainingConfigApi = async (
  dataset_id: number | null,
  params: IUpdateKnowledgeDatasetTrainingConfigParams,
) => {
  let result = false;

  try {
    const dtoResult = await httpRequest.post<boolean>({
      url: `/knowledge-bases/dataset/${dataset_id}/training-config`,
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

export interface IGetKnowledgeDatasetFileDto {
  /**
   * 数据集ID
   */
  dataset_id: number;
  /**
   * 文件名
   */
  file_name: string;
  /**
   * 文件对象
   */
  file_object_key: string;
  /**
   * 文件URL
   */
  file_url: string;
}

/**
 * 获取文本数据集中关联的文件
 * @param dataset_id
 * @returns
 */
export const getKnowledgeDatasetFileApi = async (dataset_id: number | null) => {
  let result = {} as IGetKnowledgeDatasetFileDto;

  try {
    const dtoResult = await httpRequest.get<IGetKnowledgeDatasetFileDto>({
      url: `/knowledge-bases/dataset/${dataset_id}/file`,
    });
    result = dtoResult?.data || {};
  } catch (error) {}

  return result;
};

export interface ICheckKnowledgeDatasetNameParams {
  /**
   * 数据集名称列表
   */
  dataset_names: string[];
  /**
   * 知识库id
   */
  knowledge_base_id: number | null;
  /**
   * 父级数据集id，如果无父级目录，则传空，否则正常传
   */
  parent_dataset_id?: number | null;
}

/**
 * 验证数据集名称是否重复
 * @param params
 * @returns
 */
export const checkKnowledgeDatasetNameApi = async (
  params: ICheckKnowledgeDatasetNameParams,
) => {
  let result = [] as string[];

  try {
    const dtoResult = await httpRequest.post<string[]>({
      url: `/knowledge-bases/dataset/name/check`,
      data: params,
    });
    result = dtoResult?.data || [];
  } catch (error) {}

  return result;
};
