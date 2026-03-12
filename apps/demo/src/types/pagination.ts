/**
 * 分页数据，返回的数据内容
 */
export interface PaginationDataDto<T> {
  /**
   * 内容列表，项目数据列表
   */
  content: T[];
  /**
   * 是否第一页，当前页是否为第一页
   */
  first: boolean;
  /**
   * 是否最后一页，当前页是否为最后一页
   */
  last: boolean;
  /**
   * 当前页码，当前页的页码（从0开始）
   */
  number: number;
  /**
   * 当前页元素数，当前页实际包含的数据条数
   */
  number_of_elements: number;
  /**
   * 页面大小，每页显示的数据条数
   */
  size: number;
  /**
   * 总元素数，数据总数
   */
  total_elements: number;
  /**
   * 总页数，数据总页数
   */
  total_pages: number;
}
