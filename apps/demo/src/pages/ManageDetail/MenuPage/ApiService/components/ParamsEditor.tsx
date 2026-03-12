import { Plus, Trash2, CircleCheck, Circle, GripVertical } from 'lucide-react';
import { useApi, type ApiKeyValue } from '../context/ApiContext';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { nanoid } from 'nanoid';
import { useMemo, useRef } from 'react';

import {
  EnhancedButton as Button,
  EnhancedInput as Input,
} from '@teamhelper/ui';
import { cn } from '@/lib/utils.ts';
import { useTranslation } from 'react-i18next';

interface SortableItemProps {
  param: { id?: string; key: string; value: string; enable: boolean };
  index: number;
  onKeyChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onToggle: () => void;
  onRemove: () => void;
}

function SortableParamItem({
  param,
  index,
  onKeyChange,
  onValueChange,
  onToggle,
  onRemove,
}: SortableItemProps) {
  const { t } = useTranslation('manageDetail');
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: param.id as string });

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

      <div className="flex-1">
        <Input
          placeholder={`${t('apiService.editor.param')}${index + 1}`}
          value={param.key}
          onChange={(e) => onKeyChange(e.target.value)}
        />
      </div>

      <div className="flex-1">
        <Input
          placeholder={`${t('apiService.editor.value')}${index + 1}`}
          value={param.value}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          size="small"
          className={cn(
            'border-0 shadow-none bg-transparent',
            'hover:bg-transparent',
            'px-0!',
            param.enable
              ? 'text-green-500 hover:text-green-500/70'
              : 'text-muted-foreground hover:text-muted-foreground/70',
          )}
          title={
            param.enable
              ? t('apiService.editor.disable')
              : t('apiService.editor.enable')
          }
          onClick={onToggle}
        >
          {param.enable ? <CircleCheck /> : <Circle />}
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
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

export function ParamsEditor() {
  const { t } = useTranslation('manageDetail');
  const { activeRequest, dispatch } = useApi();

  // 用 ref 存储已分配的 id 映射，避免每次渲染生成新 id
  const idMapRef = useRef<Map<number, string>>(new Map());

  if (!activeRequest) return null;

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
  const paramsWithId = useMemo(() => {
    return activeRequest.params.map((p: ApiKeyValue, index: number) => {
      if (p.id) {
        return { ...p };
      }
      // 如果没有 id，检查 ref 中是否已有映射
      let stableId = idMapRef.current.get(index);
      if (!stableId) {
        stableId = nanoid();
        idMapRef.current.set(index, stableId);
      }
      return { ...p, id: stableId };
    });
  }, [activeRequest.params]);

  const handleAddParam = () => {
    const newParams = [
      ...activeRequest.params,
      { id: nanoid(), key: '', value: '', enable: true },
    ];

    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: { params: newParams },
      },
    });
  };

  const handleRemoveParam = (index: number) => {
    const newParams = activeRequest.params.filter((_, i) => i !== index);

    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: { params: newParams },
      },
    });
  };

  const handleClearAllParams = () => {
    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: { params: [] },
      },
    });
  };

  const handleParamChange = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    const newParams = activeRequest.params.map((param, i) =>
      i === index ? { ...param, [field]: value } : param,
    );

    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: { params: newParams },
      },
    });
  };

  const handleToggleParam = (index: number) => {
    const newParams = activeRequest.params.map((param, i) =>
      i === index ? { ...param, enable: !param.enable } : param,
    );

    dispatch({
      type: 'UPDATE_REQUEST',
      payload: {
        id: activeRequest.id,
        updates: { params: newParams },
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = paramsWithId.findIndex(
        (p: ApiKeyValue) => p.id === active.id,
      );
      const newIndex = paramsWithId.findIndex(
        (p: ApiKeyValue) => p.id === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newParams = arrayMove(paramsWithId, oldIndex, newIndex);

        dispatch({
          type: 'UPDATE_REQUEST',
          payload: {
            id: activeRequest.id,
            updates: { params: newParams },
          },
        });
      }
    }
  };

  return (
    <div className="px-5 h-full flex flex-col">
      <div className="flex items-center justify-between border-b pt-2">
        <h3 className="text-sm font-medium text-foreground">
          {t('apiService.editor.queryParams')}
        </h3>
        <div className="flex items-center gap-3">
          <Button
            size="small"
            onClick={handleClearAllParams}
            title={t('apiService.editor.deleteAll')}
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
            onClick={handleAddParam}
            title={t('apiService.editor.add')}
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
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={paramsWithId.map((p) => p.id as string)}
            strategy={verticalListSortingStrategy}
          >
            {paramsWithId.map((param, index) => (
              <SortableParamItem
                key={param.id}
                param={param}
                index={index}
                onKeyChange={(val) => handleParamChange(index, 'key', val)}
                onValueChange={(val) => handleParamChange(index, 'value', val)}
                onToggle={() => handleToggleParam(index)}
                onRemove={() => handleRemoveParam(index)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
