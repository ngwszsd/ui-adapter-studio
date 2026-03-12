import {
  Plus,
  Trash2,
  Circle,
  RefreshCw,
  FileUp,
  CircleCheck,
  GripVertical,
  X,
} from 'lucide-react';
import { useApi, type ApiFormDataItem } from '../context/ApiContext';
import {
  EnhancedButton as Button,
  EnhancedInput as Input,
  Upload,
  EnhancedSelect as Select,
} from '@teamhelper/ui';
import { cn } from '@/lib/utils.ts';
import { ReactCodemirror } from '@/components/common/ReactCodemirror';
import { useBodyEditorLogic } from './useBodyEditorLogic';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { nanoid } from 'nanoid';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface IBodyEditor {
  setContentType?: () => void;
}

interface SortableItemProps {
  item: ApiFormDataItem;
  index: number;
  showFileUpload?: boolean;
  onKeyChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onTypeChange: (value: 'text' | 'file') => void;
  onFileUpload: (files: File[]) => void;
  onFileRemove: (fileIndex: number) => void;
  onToggle: () => void;
  onRemove: () => void;
}

function SortableFormDataItem({
  item,
  index,
  showFileUpload,
  onKeyChange,
  onValueChange,
  onTypeChange,
  onFileUpload,
  onFileRemove,
  onToggle,
  onRemove,
}: SortableItemProps) {
  const { t } = useTranslation('manageDetail');
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id as string });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-4 items-center group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground p-1"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <Input
          placeholder={`${t('apiService.editor.param')}${index + 1}`}
          value={item.key}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onKeyChange(e.target.value)
          }
        />
      </div>

      {showFileUpload && (
        <div className="w-24">
          <Select
            options={[
              { label: 'Text', value: 'text' },
              { label: 'File', value: 'file' },
            ]}
            value={item.type}
            onChange={(v?: string) => onTypeChange(v as 'text' | 'file')}
            searchable={false}
            allowClear={false}
            showCheck={false}
            listHeight="auto"
            inputClassName="h-9"
          />
        </div>
      )}

      <div className="flex-2 min-w-0">
        {item.type === 'file' ? (
          <div className="flex items-center h-9 w-full rounded-md border border-input bg-card transition-colors overflow-hidden">
            <div
              className="flex-1 flex items-center gap-1.5 mx-2 py-1 text-sm overflow-x-auto scrollbar-none snap-x snap-mandatory"
              style={{
                scrollbarWidth: 'none',
              }}
            >
              {item.fileNames && item.fileNames.length > 0 ? (
                item.fileNames.map((name, i) => (
                  <div
                    key={`${name}-${i}`}
                    className="flex items-center gap-1 bg-muted/50 text-foreground px-2 py-0.5 rounded-md border border-border shrink-0 snap-start h-6"
                  >
                    <span className="max-w-[120px] truncate pointer-events-none text-xs">
                      {name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileRemove(i);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground text-xs px-1">
                  {t('apiService.editor.noFileSelected')}
                </span>
              )}
            </div>
            <div className="shrink-0 flex items-center border-l border-input/50 bg-muted/10 px-1">
              <Upload
                multiple={true}
                showUploadList={false}
                beforeUpload={(_file: File, fileList: File[]) => {
                  onFileUpload(fileList);
                  return false;
                }}
              >
                <Button
                  type="link"
                  className="h-7 px-2 text-xs shadow-none border-0 hover:bg-muted/50 whitespace-nowrap"
                >
                  <FileUp className="w-3.5 h-3.5 mr-1" />
                  {t('apiService.editor.selectFile')}
                </Button>
              </Upload>
            </div>
          </div>
        ) : (
          <Input
            placeholder={`${t('apiService.editor.value')}${index + 1}`}
            value={item.value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onValueChange(e.target.value)
            }
          />
        )}
      </div>

      <div className="flex items-center justify-end gap-3 shrink-0">
        <Button
          size="small"
          className={cn(
            'border-0 shadow-none bg-transparent',
            'hover:bg-transparent',
            'px-0!',
            item.enable
              ? 'text-green-500 hover:text-green-500/70'
              : 'text-muted-foreground hover:text-muted-foreground/70',
          )}
          title={
            item.enable
              ? t('apiService.editor.disable')
              : t('apiService.editor.enable')
          }
          onClick={onToggle}
        >
          {item.enable ? (
            <CircleCheck className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </Button>

        <Button
          size="small"
          onClick={onRemove}
          className={cn(
            'border-0 shadow-none text-destructive bg-transparent',
            'hover:text-destructive/70 hover:bg-transparent',
            'px-0!',
          )}
          title={t('apiService.editor.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function BodyEditor({ setContentType }: IBodyEditor) {
  const { t } = useTranslation('manageDetail');
  const { activeRequest } = useApi();

  const {
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
  } = useBodyEditorLogic();

  // 用 ref 存储已分配的 id 映射，避免每次渲染生成新 id
  const idMapRef = useRef<Map<number, string>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 使用稳定的 id，避免每次渲染生成新 id 导致失焦
  const formDataWithId = useMemo(() => {
    if (!activeRequest) return [];
    return (activeRequest.body.formData || []).map(
      (item: ApiFormDataItem, index: number) => {
        if (item.id) {
          return { ...item };
        }
        // 如果没有 id，检查 ref 中是否已有映射
        let stableId = idMapRef.current.get(index);
        if (!stableId) {
          stableId = nanoid();
          idMapRef.current.set(index, stableId);
        }
        return { ...item, id: stableId };
      },
    );
  }, [activeRequest?.body.formData]);

  if (!activeRequest) return null;

  const renderJSONEditor = () => (
    <div className="space-y-3 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between border-b pt-2">
        <div className="text-sm text-muted-foreground">
          {t('apiService.editor.rawBody')}
        </div>
        <div className="flex items-center gap-3 hidden">
          <Button
            size="small"
            title={t('apiService.importCurl.clear')}
            className={cn(
              'border-0 shadow-none text-destructive bg-transparent',
              'hover:text-destructive/70 hover:bg-transparent',
              'px-0!',
            )}
          >
            <Trash2 />
          </Button>

          <Button
            type="link"
            size="small"
            title={t('apiService.importCurl.import')}
            className="px-0!"
          >
            <FileUp />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <ReactCodemirror
          codemirrorType="json"
          value={activeRequest.body.content}
          onChange={handleBodyContentChange}
          placeholder={t('apiService.editor.rawBody')}
        />
      </div>
    </div>
  );

  const renderFormEditor = () => {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between border-b">
          <div className="text-sm text-muted-foreground">
            {t('apiService.editor.rawBody')}
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="small"
              title={t('apiService.editor.deleteAll')}
              onClick={handleClearAllFormData}
              className={cn(
                'border-0 shadow-none text-destructive bg-transparent',
                'hover:text-destructive/70 hover:bg-transparent',
                'px-0!',
              )}
            >
              <Trash2 />
            </Button>

            <Button
              type="link"
              size="small"
              title={t('apiService.editor.add')}
              onClick={handleAddFormDataItem}
              className="px-0!"
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div className="space-y-3 py-3 flex-1 min-h-0 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, formDataWithId)}
          >
            <SortableContext
              items={formDataWithId.map((i) => i.id as string)}
              strategy={verticalListSortingStrategy}
            >
              {formDataWithId.map((item, index) => (
                <SortableFormDataItem
                  key={item.id}
                  item={item}
                  index={index}
                  onKeyChange={(val) =>
                    handleFormDataChange(index, { key: val })
                  }
                  onValueChange={(val) =>
                    handleFormDataChange(index, { value: val })
                  }
                  onTypeChange={(val) =>
                    handleFormDataChange(index, {
                      type: val,
                      value: '',
                      fileNames: [],
                    })
                  }
                  onFileUpload={(files) => handleFileUpload(index, files)}
                  onFileRemove={(fIdx) => handleFileRemove(index, fIdx)}
                  onToggle={() => handleToggleFormDataItem(index)}
                  onRemove={() => handleRemoveFormDataItem(index)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {(!activeRequest.body.formData ||
            activeRequest.body.formData.length === 0) && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {t('apiService.editor.noFormData')}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFormDataEditor = () => {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between border-b">
          <div className="text-sm text-muted-foreground">
            {t('apiService.editor.rawBody')}
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="small"
              title={t('apiService.editor.deleteAll')}
              onClick={handleClearAllFormData}
              className={cn(
                'border-0 shadow-none text-destructive bg-transparent',
                'hover:text-destructive/70 hover:bg-transparent',
                'px-0!',
              )}
            >
              <Trash2 />
            </Button>

            <Button
              type="link"
              size="small"
              title={t('apiService.editor.add')}
              onClick={handleAddFormDataItem}
              className="px-0!"
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div className="space-y-3 py-3 flex-1 min-h-0 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, formDataWithId)}
          >
            <SortableContext
              items={formDataWithId.map((i) => i.id as string)}
              strategy={verticalListSortingStrategy}
            >
              {formDataWithId.map((item, index) => (
                <SortableFormDataItem
                  key={item.id}
                  item={item}
                  index={index}
                  showFileUpload
                  onKeyChange={(val) =>
                    handleFormDataChange(index, { key: val })
                  }
                  onValueChange={(val) =>
                    handleFormDataChange(index, { value: val })
                  }
                  onTypeChange={(val) =>
                    handleFormDataChange(index, {
                      type: val,
                      value: '',
                      fileNames: [],
                    })
                  }
                  onFileUpload={(files) => handleFileUpload(index, files)}
                  onFileRemove={(fIdx) => handleFileRemove(index, fIdx)}
                  onToggle={() => handleToggleFormDataItem(index)}
                  onRemove={() => handleRemoveFormDataItem(index)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {(!activeRequest.body.formData ||
            activeRequest.body.formData.length === 0) && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {t('apiService.editor.noFormData')}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-5 py-4 h-full flex flex-col">
      <div className="flex items-center space-x-1 pb-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="text-sm text-muted-foreground font-normal">
            {t('apiService.editor.contentType')}
          </div>

          <Select
            options={[
              { label: t('apiService.none.raw'), value: 'none' },
              { label: 'application/json', value: 'application/json' },
              {
                label: 'application/x-www-form-urlencoded',
                value: 'application/x-www-form-urlencoded',
              },
              { label: 'multipart/form-data', value: 'multipart/form-data' },
            ]}
            value={activeRequest.body.type}
            onChange={(v?: string) => v && handleBodyTypeChange(v)}
            searchable={false}
            allowClear={false}
            showCheck={false}
            listHeight="auto"
            inputClassName="h-8"
            className="flex-1 w-auto min-w-[148px]"
            matchTriggerWidth={false}
          />
        </div>

        <Button
          type="link"
          size="small"
          title="Set Content-Type"
          onClick={() => {
            setContentType?.();
          }}
        >
          <RefreshCw className="w-3.5! h-3.5!" />
          {t('apiService.editor.overwrite')}
        </Button>
      </div>

      {activeRequest.body.type === 'application/json' && renderJSONEditor()}
      {activeRequest.body.type === 'application/x-www-form-urlencoded'
        ? renderFormEditor()
        : null}
      {activeRequest.body.type === 'multipart/form-data'
        ? renderFormDataEditor()
        : null}
    </div>
  );
}
