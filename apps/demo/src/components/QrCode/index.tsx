import React from 'react';
// @ts-ignore
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

// 获取 QRCodeSVG 的 props 类型（排除 ref 和 SVG 属性）
type QRCodeSVGProps = React.ComponentProps<typeof QRCodeSVG>;

type BaseQRProps = Pick<
  QRCodeSVGProps,
  | 'value'
  | 'size'
  | 'level'
  | 'bgColor'
  | 'fgColor'
  | 'includeMargin'
  | 'imageSettings'
>;

export interface QRCodeProps {
  /** 二维码内容 */
  value: string;
  /** 二维码尺寸 */
  size?: number;
  /** 中心 Logo URL */
  logo?: string;
  /** Logo 尺寸（默认二维码的 20%） */
  logoSize?: number;
  /** 容错级别 L(7%) M(15%) Q(25%) H(30%) */
  errorLevel?: 'L' | 'M' | 'Q' | 'H';
  /** 二维码颜色 */
  fgColor?: string;
  /** 背景色 */
  bgColor?: string;
  /** 外圈边距 */
  margin?: number;
  /** 渲染模式 */
  renderAs?: 'svg' | 'canvas';
  /** 自定义样式 */
  className?: string;
  /** 点击事件 */
  onClick?: () => void;
}

export const QRCode: React.FC<QRCodeProps> = (props) => {
  const {
    value,
    size = 200,
    logo,
    logoSize,
    errorLevel = 'H',
    fgColor = '#000000',
    bgColor = '#ffffff',
    margin = 1,
    renderAs = 'svg',
    className = '',
    onClick,
  } = props;

  const calculatedLogoSize = logoSize || Math.floor(size * 0.2);

  const qrCodeProps: BaseQRProps = {
    value,
    size,
    level: errorLevel,
    fgColor,
    bgColor,
    includeMargin: margin > 0,
    imageSettings: logo
      ? {
          src: logo,
          height: calculatedLogoSize,
          width: calculatedLogoSize,
          excavate: true,
        }
      : undefined,
  };

  const QRComponent = renderAs === 'canvas' ? QRCodeCanvas : QRCodeSVG;

  return (
    <div className={`inline-block ${className}`} onClick={onClick}>
      <QRComponent {...qrCodeProps} />
    </div>
  );
};

export default QRCode;
