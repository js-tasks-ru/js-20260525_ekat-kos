import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number';
  template?: (value: string | number) => string;
}

export default class SortableTable {
	element: HTMLElement | null = null;
	private sortedData: SortableTableData[];

	constructor(private headersConfig: SortableTableHeader[] = [], private data: SortableTableData[] = []) {
	 this.sortedData = data;
    this.render();
  }

  sort(field: string, order: SortOrder = 'asc'): void {
    const header = this.headersConfig.find(item => item.id === field);
    if (!header || !header.sortable) return;

    const direction = order === 'desc' ? -1 : 1;
	const sortType = header.sortType;


    this.sortedData = [...this.data].sort((a, b) => {
      const valueA = a[field];
		const valueB = b[field];
	   const options: Intl.CollatorOptions = {
       caseFirst: "upper",
           };

      if (sortType === 'number') {
        return (Number(valueA)  - Number(valueB)) * direction;
		 }
		 
      return String(valueA).localeCompare(String(valueB), ['ru', 'en'], options) * direction;
    });

    this.updateBody();
    this.updateHeaderOrder(field, order);
  }

  private updateHeaderOrder(field: string, order: SortOrder): void {
    if (!this.element) return;

    const columns = this.element.querySelectorAll('.sortable-table__header [data-id]');
    columns.forEach(column => {
      if (column.getAttribute('data-id') === field) {
        column.setAttribute('data-order', order);
      } else {
        column.removeAttribute('data-order');
      }
    });
  }

  remove(): void {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy(): void {
    this.remove();
    this.element = null;
  }

  render(): void {
    this.element = createElement(this.template());
  }

  private updateBody(): void {
    if (!this.element) return;
    const body = this.element.querySelector('[data-element="body"]');
    if (body) {
      body.innerHTML = this.getBody();
    }
  }

  private getHeader(): string {
    return this.headersConfig.map(item => `
      <div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable ?? false}">
        <span>${item.title}</span>
        ${item.sortable ? `
          <span data-element="arrow" class="sortable-table__sort-arrow">
            <span class="sort-arrow"></span>
          </span>
        ` : ''}
      </div>
    `).join('');
  }

  private getRow(row: SortableTableData): string {
    const cells = this.headersConfig.map(header => {
      const value = row[header.id];

      if (header.template) {
        return header.template(value);
      }

      return `<div class="sortable-table__cell">${value}</div>`;
    }).join('');

    return `
      <a href="/products/${row.id}" class="sortable-table__row">
        ${cells}
      </a>
    `;
  }

  private getBody(): string {
    return this.sortedData.map(row => this.getRow(row)).join('');
  }

  private template(): string {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.getHeader()}
        </div>

        <div data-element="body" class="sortable-table__body">
          ${this.getBody()}
        </div>

        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>

        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          <div>
            <p>No products satisfies your filter criteria</p>
            <button type="button" class="button-primary-outline">Reset all filters</button>
          </div>
        </div>
      </div>
    `;
  }
}
