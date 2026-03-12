export const getFileIcon = (name = '') => {
  const fileTypes = [
    { suffix: 'pdf', type: 'pdf' },
    { suffix: 'ppt', type: 'ppt' },
    { suffix: 'xlsx', type: 'xlsx' },
    { suffix: 'csv', type: 'csv' },
    { suffix: '(doc|docs)', type: 'doc' },
    { suffix: 'txt', type: 'txt' },
    { suffix: 'md', type: 'markdown' },
    { suffix: 'html', type: 'html' },
    { suffix: '(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)', type: 'kbImage' },
  ];

  return (
    fileTypes.find((item) => new RegExp(`\.${item.suffix}`, 'gi').test(name))
      ?.type || 'file'
  );
};
