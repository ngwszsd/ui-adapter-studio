import {
  Skeleton,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@teamhelper/ui';

export function CardSkeleton() {
  return (
    <Card className="rounded-[18px] flex flex-col border border-border h-full">
      <CardHeader className="pb-4 flex-row justify-between items-center">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-[18px] w-8 rounded-full" />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-3.5 h-[42px]">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="flex items-center">
          <Skeleton className="h-3 w-10 mr-2" />
          <div className="flex -space-x-2 items-center">
            <Skeleton className="h-[26px] w-[26px] rounded-full border-2 border-background" />
            <Skeleton className="h-[26px] w-[26px] rounded-full border-2 border-background" />
            <Skeleton className="h-[26px] w-[26px] rounded-full border-2 border-background" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pb-0">
        <div className="h-[52px] w-full flex items-center border-t border-border">
          <Skeleton className="h-4 w-4 mr-2 rounded" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardFooter>
    </Card>
  );
}
