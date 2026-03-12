import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Timeline,
} from '@teamhelper/ui';

const TimelineDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>时间轴 (Timeline)</CardTitle>
      <CardDescription>垂直展示的时间流信息。</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 flex flex-col">
      <Timeline
        items={[
          {
            label: (
              <div className="rounded-[4px] bg-[#EBF4FF] px-2 flex items-center justify-center w-fit py-0.5">
                <div className="text-xs text-primary">当前</div>
              </div>
            ),
            children: (
              <div className="mt-3">
                <div className="text-[#165DFF] text-xs">v2.0.2</div>
                <div className="mt-1.5">
                  <div className="flex items-center">
                    <div className="mr-1.5 bg-[#FFFCE9] w-4 h-4 rounded-full flex items-center justify-center">
                      <div className="text-[#FBA124] text-xs font-medium scale-[0.8]">
                        林
                      </div>
                    </div>
                    <div className="text-[#718096] text-xs">林小喜</div>
                  </div>
                  <div className="text-[#A0AEC0] text-xs mt-1">
                    修复了部分Bug
                  </div>
                </div>
                <div className="text-[#718096] text-xs mt-1.5">2025-03-25</div>
              </div>
            ),
            color: '#165DFF',
          },
          {
            label: (
              <div className="rounded-[4px] bg-[#FFF6EB] px-2 flex items-center justify-center w-fit py-0.5">
                <div className="text-xs text-[#EE7B30]">历史</div>
              </div>
            ),
            children: (
              <div className="mt-3">
                <div className="text-[#165DFF] text-xs">v2.0.1</div>
                <div className="mt-1.5">
                  <div className="flex items-center">
                    <div className="mr-1.5 bg-[#FFFCE9] w-4 h-4 rounded-full flex items-center justify-center">
                      <div className="text-[#FBA124] text-xs font-medium scale-[0.8]">
                        林
                      </div>
                    </div>
                    <div className="text-[#718096] text-xs">林小喜</div>
                  </div>
                  <div className="text-[#A0AEC0] text-xs mt-1">
                    修复了部分Bug
                  </div>
                </div>
                <div className="text-[#718096] text-xs mt-1.5">2025-03-25</div>
              </div>
            ),
            color: '#D3D3D8',
          },
        ]}
      />
    </CardContent>
  </Card>
);

export default TimelineDemo;
