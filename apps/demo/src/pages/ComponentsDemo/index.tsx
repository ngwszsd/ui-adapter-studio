import {
  ButtonsDemo,
  TooltipDemo,
  EnhanceModalDemo,
  BadgeDemo,
  EnhancedTableBasicDemo,
  EnhancedTableFeaturesDemo,
  EnhancedListDemo,
  EnhancedTreeDemo,
  AlertDemo,
  FormDemo,
  InteractiveDemo,
  SkeletonDemo,
  TabsDemo,
  DialogDemo,
  ToastDemo,
  AlertDialogDemo,
  TableDemo,
  AspectRatioDemo,
  ButtonGroupDemo,
  DrawerDemo,
  DropdownMenuDemo,
  EmptyDemo,
  MenubarDemo,
  NavigationMenuDemo,
  PopoverDemo,
  ResizableDemo,
  SeparatorDemo,
  SheetDemo,
  SpinnerDemo,
  PaginationDemo,
  LargeDataPerformanceDemo,
  UploadDraggerDemo,
  DatePickerDemo,
  TimelineDemo,
  BreadcrumbDemo,
  UploadDemo,
} from './demos';
import AvatarDemo from './demos/AvatarDemo';
import CommonDemo from './demos/CommonDemo';
import DirectoryTreeDemo from './demos/DirectoryTreeDemo';
import InlineEditableTextDemo from './demos/InlineEditableTextDemo';
import PageHeaderDemo from './demos/PageHeaderDemo';
import RevealPasswordDemo from './demos/RevealPasswordDemo';
import StepsDemo from './demos/StepsDemo';
import ThUploadDemo from './demos/ThUploadDemo';
import ThUploadDraggerDemo from './demos/ThUploadDraggerDemo';
import InputNumberDemo from './demos/InputNumberDemo';

const ComponentsDemo = () => {
  return (
    <>
      <div className="container mx-auto p-6 space-y-8 h-full overflow-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Shadcn/UI 组件展示</h1>
          <p className="text-muted-foreground">展示项目中所有可用的 UI 组件</p>
        </div>

        <ButtonsDemo />
        <TooltipDemo />
        <EnhanceModalDemo />
        <BadgeDemo />
        <EnhancedTableBasicDemo />
        <EnhancedTableFeaturesDemo />
        <EnhancedListDemo />
        <EnhancedTreeDemo />
        <AlertDemo />
        <FormDemo />
        <InteractiveDemo />
        <SkeletonDemo />
        <TabsDemo />
        <DialogDemo />
        <ToastDemo />
        <AlertDialogDemo />
        <TableDemo />
        <AspectRatioDemo />
        <ButtonGroupDemo />
        <DrawerDemo />
        <DropdownMenuDemo />
        <EmptyDemo />
        <MenubarDemo />
        <NavigationMenuDemo />
        <PopoverDemo />
        <ResizableDemo />
        <SeparatorDemo />
        <SheetDemo />
        <SpinnerDemo />
        <PaginationDemo />
        <LargeDataPerformanceDemo />
        <UploadDemo />
        <UploadDraggerDemo />
        <DatePickerDemo />
        <TimelineDemo />
        <BreadcrumbDemo />
        <PageHeaderDemo />
        <AvatarDemo />
        <RevealPasswordDemo />
        <InlineEditableTextDemo />
        <StepsDemo />
        <CommonDemo />
        <DirectoryTreeDemo />
        <ThUploadDemo />
        <ThUploadDraggerDemo />
        <InputNumberDemo />
      </div>
    </>
  );
};

export default ComponentsDemo;
