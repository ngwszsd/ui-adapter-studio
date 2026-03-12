import React, { useState, useEffect, useRef, memo } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import AppIcon from '@/assets/img/app-icon.webp';
import LaunchPage from '@/assets/img/launch-page.webp';
import { Button, Card, CardContent, CardHeader, Upload } from '@teamhelper/ui';
import { downloadFile } from '@/lib/utils';
import {
  getTerminalSettingsApi,
  saveTerminalSettingsApi,
  getCustomPackageApi,
  type TerminalSettingsDto,
  type TerminalSettingsParams,
} from './server';
import { getRemotePreSignApi, commonUploadByPut } from '@/common/server';
export const LaunchDesign: React.FC = memo(() => {
  const { project_id } = useParams<{ project_id: string }>();
  const { t } = useTranslation('manageDetail');

  const [projectInfo, setProjectInfo] = useState<TerminalSettingsDto>({
    custom_package_url: '', // 个性化终端安装包的下载地址 URL
    source_package_url: '', // 源安装包的下载地址 URL
    icon_url: '', // 图标图片地址 URL
    splash_image_url: '', // 启动页图片 URL
  });

  const iconFileList = React.useMemo(
    () =>
      projectInfo.icon_url
        ? [
            {
              uid: 'icon',
              name: 'icon.png',
              status: 'done',
              url: projectInfo.icon_url,
            },
          ]
        : [],
    [projectInfo.icon_url],
  );

  const splashFileList = React.useMemo(
    () =>
      projectInfo.splash_image_url
        ? [
            {
              uid: 'splash',
              name: 'splash.png',
              status: 'done',
              url: projectInfo.splash_image_url,
            },
          ]
        : [],
    [projectInfo.splash_image_url],
  );

  async function fetchData() {
    try {
      const res = await getTerminalSettingsApi(Number(project_id));
      if (res.data) setProjectInfo(res.data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (file: File, type: 'appIcon' | 'startUpIcon') => {
    try {
      const preSignRes = await getRemotePreSignApi({
        type: 'avatar',
        file_name: `${type}-${file.name}`,
      });
      const { upload_url, file_key } = preSignRes.data;
      await commonUploadByPut(upload_url, file);
      const params: TerminalSettingsParams = {};
      if (type === 'appIcon') {
        params.icon_url = file_key;
      }
      if (type === 'startUpIcon') {
        params.splash_image_url = file_key;
      }
      await saveTerminalSettingsApi(Number(project_id), params);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (type: 'appIcon' | 'startUpIcon') => {
    try {
      const params: TerminalSettingsParams = {};
      if (type === 'appIcon') {
        params.icon_url = '';
      }
      if (type === 'startUpIcon') {
        params.splash_image_url = '';
      }
      await saveTerminalSettingsApi(Number(project_id), params);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const [TerminalDownUrl, setTerminalDownUrl] = useState('');
  async function fetchTerminalDownUrl() {
    try {
      const res = await getCustomPackageApi(Number(project_id));
      setTerminalDownUrl(res.data);
    } catch (e) {}
  }

  useEffect(() => {
    fetchTerminalDownUrl();
  }, []);
  return (
    <div className="h-full px-5">
      <div className="w-full mx-auto relative">
        <div className="py-5 flex justify-between items-center sticky top-0 bg-background z-10">
          <div>
            <div className="font-medium text-lg mb-[6px]">
              {t('launch.design')}
            </div>
            <div className="text-muted-foreground font-normal text-xs">
              {t('launch.design.des')}
            </div>
          </div>
          <div className="space-x-2">
            {!projectInfo.icon_url && (
              <Button
                disabled={!TerminalDownUrl}
                variant="default"
                onClick={() => {
                  if (TerminalDownUrl) downloadFile(TerminalDownUrl, 'xxx.apk');
                }}
              >
                <Download />
                {t('launch.design.download.package')}
              </Button>
            )}
            {projectInfo.icon_url && (
              <>
                <Button
                  variant="outline"
                  disabled={!projectInfo.source_package_url}
                  onClick={() => {
                    downloadFile(projectInfo.source_package_url, 'xxx.apk');
                  }}
                >
                  <Download />
                  {t('launch.design.download.sourcePackage')}
                </Button>
                <Button
                  variant="default"
                  disabled={!projectInfo.custom_package_url}
                  onClick={() => {
                    downloadFile(projectInfo.custom_package_url, 'xxx.apk');
                  }}
                >
                  <Download />
                  {t('launch.design.download.customPackage')}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* 应用图标设置 */}
          <Card>
            <CardHeader className="border-b border-border mx-6 px-0 pb-[16px]">
              <div className="flex items-center gap-2 font-medium text-base">
                {t('launch.design.icon.setting')}
              </div>
              <div className="text-muted-foreground font-normal text-xs">
                {t('launch.design.upload.des')}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-5 pt-3">
                {/* 图标上传区域 */}
                <div className="shrink-0 flex flex-col gap-2 w-[280px]">
                  <div className="font-medium text-xs text-muted-foreground">
                    {t('launch.design.upload.icon')}
                  </div>
                  <div>
                    <Upload.Dragger
                      accept=".png"
                      multiple={false}
                      listType={'card'}
                      className="h-[164px]"
                      fileList={iconFileList as any}
                      showFileList={true}
                      description={
                        <div className="space-y-3">
                          <div className="text-sm font-medium">
                            {t('launch.design.click.or.drag')}
                          </div>
                          <div className="text-[12px] font-normal">
                            {t('launch.design.uploadcomp')}
                          </div>
                        </div>
                      }
                      onChange={(files) => {
                        if (files[0]) {
                          handleUpload(files[0], 'appIcon');
                        } else {
                          handleRemove('appIcon');
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 预览效果 */}
                <div className="flex-1">
                  <div className="font-medium text-xs text-muted-foreground mb-2">
                    {t('launch.design.defaultEffect')}
                  </div>
                  <div className="w-fit">
                    <div className="flex flex-col justify-center gap-3 ">
                      <div className="w-[62px] h-[62px] rounded-[8px] flex items-center justify-center">
                        <img
                          style={{ objectFit: 'cover' }}
                          src={projectInfo.icon_url || AppIcon}
                          alt=""
                          className="w-full h-full rounded-[8px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 启动页面设置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 font-medium text-base">
                {t('launch.design.pageSetting')}
              </div>
              <div className="text-muted-foreground font-normal text-xs">
                {t('launch.design.upload.page.des')}
              </div>
            </CardHeader>
            <CardContent className="min-h-[220px]">
              <div className="flex items-start gap-6 h-full">
                {/* 启动页上传区域 */}
                <div className="shrink-0 flex flex-col gap-2 w-[304px]">
                  <div className="font-medium text-xs text-muted-foreground">
                    {t('launch.design.upload.icon')}
                  </div>
                  <div>
                    <Upload.Dragger
                      accept=".png,.gif"
                      multiple={false}
                      listType={'card'}
                      className="h-[171px]"
                      fileList={splashFileList as any}
                      showFileList={true}
                      description={
                        <div className="space-y-3">
                          <div className="text-sm font-medium">
                            {t('launch.design.click.or.drag')}
                          </div>
                          <div className="text-[12px] font-normal">
                            {t('launch.design.uploadcomp1')}
                          </div>
                        </div>
                      }
                      onChange={(files) => {
                        if (files[0]) {
                          handleUpload(files[0], 'startUpIcon');
                        } else {
                          handleRemove('startUpIcon');
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 预览效果 */}
                <div className="flex-1">
                  {/* 添加最小高度约束 */}
                  <div className="font-medium text-xs text-muted-foreground mb-2">
                    {t('launch.design.defaultEffect')}
                  </div>
                  <div className="flex-1 bg-muted rounded-[8px] w-[304px] h-[171px]">
                    <img
                      style={{ objectFit: 'cover' }}
                      src={projectInfo.splash_image_url || LaunchPage}
                      alt=""
                      className="w-full h-full rounded-[8px]"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});
