import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@teamhelper/ui';
import { ReactCodemirror } from '@/components/common/ReactCodemirror';
import { useState } from 'react';
import { ReactSyntaxHighlighter } from '@/components/common/ReactSyntaxHighlighter';

const jsonData = JSON.stringify(
  {
    name: 'th-agent',
    version: '1.0.0',
    description:
      "Garvin's full-stack monorepo with React frontend, NestJS backend, and shared packages红红火火恍恍惚惚哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈",
    private: true,
    packageManager: 'pnpm@9.0.0',
    engines: {
      node: '>=20.0.0',
      pnpm: '>=9.0.0',
    },
    type: 'module',
    scripts: {
      dev: 'turbo run dev --filter=./**  --filter=!@teamhelper/hooks',
      'dev:all': 'turbo run dev',
      'build:all': 'turbo run build',
      'lint:all': 'turbo run lint',
      'test:all': 'turbo run test',
      'clean:all': 'turbo run clean',
      'format:all': 'turbo run format',
      'ui:dev': 'pnpm --filter @teamhelper/ui dev',
      'ui:build': 'pnpm --filter @teamhelper/ui build',
      'ui:format': 'pnpm --filter @teamhelper/ui format',
      'frontend:dev': 'pnpm --filter frontend dev',
      'frontend:build': 'pnpm --filter frontend build',
      'frontend:format': 'pnpm --filter frontend format',
      'backend:dev': 'pnpm --filter backend start:dev',
      'backend:build': 'pnpm --filter backend build',
      'backend:format': 'pnpm --filter backend format',
      'install:all': 'pnpm install',
      'type-check': 'turbo run type-check',
      prepare: 'husky',
    },
    devDependencies: {
      '@commitlint/cli': '^20.1.0',
      '@commitlint/config-conventional': '^20.0.0',
      '@types/node': '^24.10.1',
      husky: '^9.1.7',
      'lint-staged': '^16.2.6',
      prettier: '^3.6.2',
      turbo: '^2.6.1',
      typescript: '^5.9.3',
    },
    'lint-staged': {
      '*.{js,jsx,ts,tsx,json,css,md}': ['prettier --write'],
    },
  },
  null,
  2,
);

const CommonDemo = () => {
  const [isRCMReadOnly, setIsRCMReadOnly] = useState<boolean>(true);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>代码编辑器 (ReactCodemirror)</CardTitle>
          <CardDescription>目前仅支持2种语言(json、javascript)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="text-sm text-foreground font-medium">只读</div>
            <Switch
              checked={isRCMReadOnly}
              onCheckedChange={setIsRCMReadOnly}
            />
          </div>

          <ReactCodemirror
            codemirrorType="json"
            placeholder="json"
            readOnly={isRCMReadOnly}
            className="h-80"
            value={jsonData}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>代码高亮 (ReactSyntaxHighlighter)</CardTitle>
          <CardDescription>
            目前仅支持3种语言(json、javascript、python)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm text-foreground font-medium">json</div>
            <div className="h-80">
              <ReactSyntaxHighlighter language="json">
                {jsonData}
              </ReactSyntaxHighlighter>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-foreground font-medium">
              javascript
            </div>
            <div className="h-80">
              <ReactSyntaxHighlighter language="javascript">
                {`curl --request GET \\\n
                  --url 'https://cn.bing.com/hp/api/v1/carousel?format=json&ecount%5B0%5D=20&ecount%5B1%5D=24&efirst%5B0%5D=0&efirst%5B1%5D=0&features%5B0%5D=tobads&features%5B1%5D=tobcnads&ads=1' \
                  --header 'accept: */*' \\\n
                  --header 'accept-language: zh-CN,zh;q=0.9' \\\n
                  --header 'ect: 4g' \\\n
                  --header 'priority: u=1, i' \\\n
                  --header 'referer: https://cn.bing.com/' \\\n
                  --header 'sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"' \\\n
                  --header 'sec-ch-ua-arch: "arm"' \\\n
                  --header 'sec-ch-ua-bitness: "64"' \\\n
                  --header 'sec-ch-ua-full-version: "142.0.7444.176"' \\\n
                  --header 'sec-ch-ua-full-version-list: "Chromium";v="142.0.7444.176", "Google Chrome";v="142.0.7444.176", "Not_A Brand";v="99.0.0.0"' \\\n
                  --header 'sec-ch-ua-mobile: ?0' \\\n
                  --header 'sec-ch-ua-model: ""' \\\n
                  --header 'sec-ch-ua-platform: "macOS"' \\\n
                  --header 'sec-ch-ua-platform-version: "15.2.0"' \\\n
                  --header 'sec-fetch-dest: empty' \\\n
                  --header 'sec-fetch-mode: cors' \\\n
                  --header 'sec-fetch-site: same-origin' \\\n
                  --header 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
                `}
              </ReactSyntaxHighlighter>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-foreground font-medium">python</div>
            <div className="h-40">
              <ReactSyntaxHighlighter language="python">
                {[
                  'def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):def text_transform(text, shift):',
                  '    result = []',
                  '    for char in text:',
                  '        if char.isalpha():',
                  "            base = ord('A') if char.isupper() else ord('a')",
                  '            transformed = (ord(char) - base + shift) % 26',
                  '            result.append(chr(transformed + base))',
                  '        else:',
                  '            result.append(char)',
                  "    return ''.join(result)",
                ].join('\n')}
              </ReactSyntaxHighlighter>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default CommonDemo;
