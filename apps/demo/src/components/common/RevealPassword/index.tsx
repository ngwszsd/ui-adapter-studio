import React from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedButton as Button } from '@teamhelper/ui';

type RevealPasswordProps = {
  password?: string;
  mask?: string;
  className?: string;
  onReveal?: () => Promise<string> | string;
};

const RevealPassword: React.FC<RevealPasswordProps> = ({
  password = '-',
  mask = '********',
  className,
  onReveal,
}) => {
  const [revealed, setRevealed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fetchedPassword, setFetchedPassword] = React.useState<string>('');

  const handleToggle = async () => {
    // 如果当前是隐藏状态且有 onReveal 函数，则调用接口获取密码
    if (!revealed && onReveal) {
      setLoading(true);
      try {
        const pwd = await onReveal();
        if (!pwd) return;
        setFetchedPassword(pwd);
        setRevealed(true);
      } catch (error) {
        console.error('Failed to reveal password:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // 如果当前是显示状态，则切换为隐藏
      setRevealed((prev) => !prev);
    }
  };

  const displayPassword = onReveal ? fetchedPassword : password;
  const display = revealed ? displayPassword : mask;

  return (
    <div className={cn('flex items-center', className)}>
      <span>{display}</span>

      <Button
        type="text"
        size="small"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        ) : !revealed ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};

export default RevealPassword;
