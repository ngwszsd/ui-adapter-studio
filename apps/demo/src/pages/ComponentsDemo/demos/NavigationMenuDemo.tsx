import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@teamhelper/ui';

const NavigationMenuDemo = () => (
  <Card>
    <CardHeader>
      <CardTitle>导航菜单 (NavigationMenu)</CardTitle>
      <CardDescription>用于网站导航的菜单组件</CardDescription>
    </CardHeader>
    <CardContent>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>产品</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <div className="row-span-3">
                  <NavigationMenuLink asChild>
                    <a
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                      href="/"
                    >
                      <div className="mb-2 mt-4 text-lg font-medium">
                        产品介绍
                      </div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        了解我们的产品特性和优势
                      </p>
                    </a>
                  </NavigationMenuLink>
                </div>
                <div className="grid gap-1">
                  <NavigationMenuLink asChild>
                    <a
                      className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      href="/docs"
                    >
                      <div className="text-sm font-medium leading-none">
                        文档
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        查看详细的使用文档
                      </p>
                    </a>
                  </NavigationMenuLink>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
              关于我们
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </CardContent>
  </Card>
);

export default NavigationMenuDemo;
