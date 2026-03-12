import { UserRound } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EnhancedAvatar as Avatar,
} from '@teamhelper/ui';

const AvatarDemo = () => {
  const url_01 = 'https://api.dicebear.com/7.x/avataaars/svg?seed=1';
  const url_02 =
    'https://q8.itc.cn/q_70/images03/20241026/dc05687f8e514bf2aef1f2a597a20ef7.jpeg';
  return (
    <Card>
      <CardHeader>
        <CardTitle>头像 (Avatar)</CardTitle>
        <CardDescription>
          用来代表用户或事物，支持图片、图标或字符展示。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-x-4">
          <Avatar icon={<UserRound className="w-5 h-5" />} />
          <Avatar>U</Avatar>
          <Avatar size={40}>USER</Avatar>
          <Avatar src={url_01} />
          <Avatar src={<img draggable={false} src={url_01} alt="avatar" />} />
          <Avatar className="bg-orange-400/20 text-orange-500">U</Avatar>
          <Avatar
            className="bg-orange-400"
            icon={<UserRound className="w-5 h-5" />}
          />
          <Avatar autoColor initialOnly>
            唐钱进
          </Avatar>
          <Avatar autoColor initialOnly>
            钮国伟
          </Avatar>
          <Avatar autoColor initialOnly>
            钟太松
          </Avatar>
        </div>

        <div className="space-x-4">
          <Avatar
            shape="square"
            size="xlarge"
            icon={<UserRound className="w-8 h-8" />}
          />
          <Avatar shape="square">U</Avatar>
          <Avatar shape="square" size={40}>
            USER
          </Avatar>
          <Avatar shape="square" src={url_02} />
          <Avatar
            shape="square"
            src={<img draggable={false} src={url_02} alt="avatar" />}
          />
          <Avatar shape="square" className="bg-orange-400/20 text-orange-500">
            U
          </Avatar>
          <Avatar
            shape="square"
            className="bg-orange-400"
            icon={<UserRound className="w-5 h-5" />}
          />
          <Avatar shape="square" autoColor initialOnly>
            唐钱进
          </Avatar>
          <Avatar shape="square" autoColor initialOnly>
            钮国伟
          </Avatar>
          <Avatar shape="square" autoColor initialOnly>
            钟太松
          </Avatar>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvatarDemo;
