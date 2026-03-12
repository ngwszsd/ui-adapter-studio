import { useMemo } from 'react';
import React from 'react';
import {
  FaCode,
  FaFont,
  FaHashtag,
  FaList,
  FaToggleOn,
  FaCube,
} from 'react-icons/fa';
import { useDesignerStore } from '../../store/useDesignerStore';
import type { VariablePickerData, VariableGroup, VariableGroupItem } from './VariablePickerPanel';

/**
 * Transforms global variables from the designer store into VariablePickerData
 * format consumed by TemplateInput / TemplateTextarea / VariablePickerPanel.
 *
 * Template format: `{{globals.<variableName>}}`
 */
export const useVariablePickerData = (): VariablePickerData => {
  const globalVariables = useDesignerStore((s) => s.globalVariables);

  return useMemo(() => {
    const items: VariableGroupItem[] = globalVariables.map((v) => {
      let icon: React.ReactNode;
      switch (v.type) {
        case 'string':
          icon = React.createElement(FaFont, { size: 10 });
          break;
        case 'integer':
        case 'number':
          icon = React.createElement(FaHashtag, { size: 10 });
          break;
        case 'boolean':
          icon = React.createElement(FaToggleOn, { size: 10 });
          break;
        case 'object':
          icon = React.createElement(FaCode, { size: 10 });
          break;
        case 'array':
          icon = React.createElement(FaList, { size: 10 });
          break;
        default:
          icon = React.createElement(FaFont, { size: 10 });
      }

      return {
        template: `{{globals.${v.name}}}`,
        groupId: 'globals',
        label: v.name,
        chipLabel: `globals > ${v.name}`,
        icon,
        typeSpec: { type: v.type },
      };
    });

    const globalsGroup: VariableGroup = {
      id: 'globals',
      label: '全局变量',
      icon: React.createElement(FaCube, { size: 12 }),
      items,
    };

    const itemByTemplate: Record<string, VariableGroupItem> = {};
    for (const item of items) {
      itemByTemplate[item.template] = item;
    }

    return {
      groups: [globalsGroup],
      itemByTemplate,
    };
  }, [globalVariables]);
};
