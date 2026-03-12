import { useApi, type ApiFormDataItem } from '../context/ApiContext';
import { getRemotePreSignApi, commonUploadByPut } from '@/common/server';
import { message } from '@teamhelper/ui';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import { arrayMove } from '@dnd-kit/sortable';
import { type DragEndEvent } from '@dnd-kit/core';

/**
 * BodyEditor 逻辑控制 Hook
 * 处理请求体类型切换、内容编辑、表单数据管理及文件上传等业务逻辑
 */
export function useBodyEditorLogic() {
  const { activeRequest, dispatch } = useApi();
  const { t } = useTranslation('manageDetail');

  /**
   * 处理请求体 Content-Type 切换
   * @param type 新的请求体类型
   */
  const handleBodyTypeChange = (type: string) => {
    if (!activeRequest) return;
    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: {
          body: {
            ...activeRequest.body,
            type: type as any,
            content: type === 'application/json' ? '{\n  \n}' : '',
          },
        },
      },
    });
  };

  /**
   * 处理 JSON 模式下的内容变更
   * @param content JSON 字符串
   */
  const handleBodyContentChange = (content: string) => {
    if (!activeRequest) return;
    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: {
          body: {
            ...activeRequest.body,
            content,
          },
        },
      },
    });
  };

  /**
   * 处理表单项（FormData / Form-UrlEncoded）的数据变更
   * @param index 项索引
   * @param updates 更新的属性对象
   */
  const handleFormDataChange = (
    index: number,
    updates: Partial<ApiFormDataItem>,
  ) => {
    if (!activeRequest) return;
    const newFormData =
      activeRequest.body.formData?.map((item, i) =>
        i === index ? { ...item, ...updates } : item,
      ) || [];

    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: {
          body: {
            ...activeRequest.body,
            formData: newFormData,
          },
        },
      },
    });
  };

  /**
   * 切换表单项的启用/禁用状态
   * @param index 项索引
   */
  const handleToggleFormDataItem = (index: number) => {
    if (!activeRequest) return;
    const newFormData =
      activeRequest.body.formData?.map((item, i) =>
        i === index ? { ...item, enable: !item.enable } : item,
      ) || [];

    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: {
          body: {
            ...activeRequest.body,
            formData: newFormData,
          },
        },
      },
    });
  };

  /**
   * 新增一个表单项
   */
  const handleAddFormDataItem = () => {
    if (!activeRequest) return;
    const newFormData = [
      ...(activeRequest.body.formData || []),
      {
        id: nanoid(),
        key: '',
        value: '',
        type: 'text' as const,
        enable: true,
      },
    ];

    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: {
          body: {
            ...activeRequest.body,
            formData: newFormData,
          },
        },
      },
    });
  };

  /**
   * 清空所有表单数据
   */
  const handleClearAllFormData = () => {
    if (!activeRequest) return;
    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: {
          body: {
            ...activeRequest.body,
            formData: [],
          },
        },
      },
    });
  };

  /**
   * 处理多文件上传逻辑
   * 包含获取预签名地址、PUT上传文件及更新表单值
   * @param index 表单项索引
   * @param files 文件对象数组
   */
  const handleFileUpload = async (index: number, files: File[]) => {
    if (!activeRequest) return;
    try {
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          // 1. 获取预签名上传地址
          const preSignRes = await getRemotePreSignApi({
            file_name: file.name,
            type: 'apiFileTmp',
          });

          if (!preSignRes.data) {
            throw new Error('获取上传地址失败');
          }

          const { upload_url, file_key } = preSignRes.data;
          // 2. 使用 PUT 上传文件
          await commonUploadByPut(upload_url, file);
          return { file_key, name: file.name };
        }),
      );

      const fileKeys = uploadResults.map((r) => r.file_key);
      const fileNames = uploadResults.map((r) => r.name);

      // 将 fileKey 以 , 拼接形式存储在 value 中（适配后端格式）
      handleFormDataChange(index, {
        value: fileKeys.join(','),
        fileNames,
      });
      // message.success(t('apiService.editor.uploadSuccess'));
    } catch (error) {
      console.error('File upload failed:', error);
      // message.error(t('apiService.editor.uploadFailed'));
    }
  };

  /**
   * 移除已上传的文件
   * @param index 表单项索引
   * @param fileIndex 文件在列表中的索引
   */
  const handleFileRemove = (index: number, fileIndex: number) => {
    if (!activeRequest) return;
    const item = activeRequest.body.formData?.[index];
    if (!item || !item.fileNames) return;

    const newFileNames = item.fileNames.filter((_, i) => i !== fileIndex);
    const fileKeys = item.value ? item.value.split(',') : [];
    const newFileKeys = fileKeys.filter((_, i) => i !== fileIndex);
    const newValue = newFileKeys.join(',');

    handleFormDataChange(index, {
      fileNames: newFileNames,
      value: newValue,
    });
  };

  /**
   * 删除指定的表单项
   * @param index 项索引
   */
  const handleRemoveFormDataItem = (index: number) => {
    if (!activeRequest) return;
    const newFormData =
      activeRequest.body.formData?.filter((_, i) => i !== index) || [];

    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: {
          body: {
            ...activeRequest.body,
            formData: newFormData,
          },
        },
      },
    });
  };

  /**
   * 处理拖拽排序结束逻辑
   * @param event 拖拽平移事件
   * @param formDataWithId 带有稳定 ID 的数据视图
   */
  const handleDragEnd = (
    event: DragEndEvent,
    formDataWithId: ApiFormDataItem[],
  ) => {
    if (!activeRequest) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formDataWithId.findIndex(
        (p: ApiFormDataItem) => p.id === active.id,
      );
      const newIndex = formDataWithId.findIndex(
        (p: ApiFormDataItem) => p.id === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFormData = arrayMove(formDataWithId, oldIndex, newIndex);

        dispatch({
          type: 'UPDATE_REQUEST',
          payload: {
            id: activeRequest.id,
            updates: {
              body: {
                ...activeRequest.body,
                formData: newFormData,
              },
            },
          },
        });
      }
    }
  };

  return {
    handleBodyTypeChange,
    handleBodyContentChange,
    handleFormDataChange,
    handleToggleFormDataItem,
    handleAddFormDataItem,
    handleClearAllFormData,
    handleFileUpload,
    handleFileRemove,
    handleRemoveFormDataItem,
    handleDragEnd,
  };
}
