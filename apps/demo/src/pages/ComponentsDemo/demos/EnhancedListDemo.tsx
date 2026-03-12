import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  List,
} from '@teamhelper/ui';

type DemoListItem = { id: number; lines: number };

const EnhancedListDemo = () => {
  const demoListData: DemoListItem[] = React.useMemo(() => {
    return Array.from({ length: 12000 }).map((_, i) => ({
      id: i + 1,
      lines: (i % 6) + 1,
    }));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>增强列表 (虚拟滚动 + 动态高度)</CardTitle>
        <CardDescription>
          基于 @tanstack/react-virtual 的通用 List，支持动态高度
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="text-sm text-muted-foreground">
            estimatedItemSize=40, containerHeight=420
          </div>
          <List
            dataSource={demoListData}
            estimatedItemSize={40}
            containerHeight={420}
            renderItem={(item) => (
              <div className="px-4 py-3 border-b border-border bg-card hover:bg-muted/30">
                <div className="font-medium">条目 #{item.id}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {Array.from({ length: item.lines }).map((_, idx) => (
                    <p key={idx}>
                      这是第 {idx + 1} 段内容，用于模拟动态高度渲染。
                    </p>
                  ))}
                </div>
              </div>
            )}
          />
        </section>

        <section className="space-y-3">
          <div className="text-sm text-muted-foreground">
            estimatedItemSize=36, containerHeight=320
          </div>
          <List
            dataSource={demoListData}
            estimatedItemSize={36}
            containerHeight={320}
            renderItem={(item) => (
              <div className="px-3 py-2 border-b">
                <div className="text-sm font-medium">Item {item.id}</div>
                <div className="text-xs text-muted-foreground">
                  {Array.from({ length: Math.max(1, item.lines - 1) }).map(
                    (_, idx) => (
                      <p key={idx}>动态内容行 {idx + 1}</p>
                    ),
                  )}
                </div>
              </div>
            )}
          />
        </section>
      </CardContent>
    </Card>
  );
};

export default EnhancedListDemo;
