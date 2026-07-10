import { createElement } from "../../shared/utils/create-element";

type SortOrder = 'asc' | 'desc';

type SortableTableData = Record<string, string | number>;

type SortableTableSort = {
  id: string;
  order: SortOrder;
};

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: 'string' | 'number' | 'custom';
  template?: (value: string | number) => string;
  customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
  data?: SortableTableData[];
  sorted?: SortableTableSort;
  isSortLocally?: boolean;
}

export default class SortableTable {
  element: HTMLElement | null = null;
  private data: SortableTableData[];
  private sortedData: SortableTableData[];
  private isSortLocally: boolean;
  private handleHeaderClick: (event: Event) => void = () => {};

  constructor(private headersConfig: SortableTableHeader[] = [], {
    data = [],
    sorted,
    isSortLocally = true
  }: Options = {}) {
    this.data = data;
    this.sortedData = [...data];
    this.isSortLocally = isSortLocally;

    this.render();
    this.addEventListeners();

   
    if (sorted) {
      this.sort(sorted.id, sorted.order);
    }
  }

  sort(field: string, order: SortOrder): void {
    this.updateHeaderOrder(field, order);

    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }
  }

  private sortOnClient(field: string, order: SortOrder): void {
    const header = this.headersConfig.find(item => item.id === field);
    if (!header || !header.sortable) return;

    const direction = order === 'desc' ? -1 : 1;
    const sortType = header.sortType;

    this.sortedData = [...this.data].sort((a, b) => {

      if (sortType === 'custom' && header.customSorting) {
        return header.customSorting(a, b) * direction;
      }

      const valueA = a[field];
		const valueB = b[field];
		const options: Intl.CollatorOptions = { caseFirst: 'upper' };

      if (sortType === 'number') {
        return (Number(valueA) - Number(valueB)) * direction;
      }


      return String(valueA).localeCompare(String(valueB), ['ru', 'en'], options) * direction;
    });

    this.updateBody();
  }

  private sortOnServer(field: string, order: SortOrder): void {

    console.log(`Sort on server: field=${field}, order=${order}`);
  }

private updateHeaderOrder(field: string, order: SortOrder): void {
  if (!this.element) return;

  const columns = this.element.querySelectorAll('[data-sortable="true"]');

  columns.forEach((column) => {
    const el = column as HTMLElement;

    if (el.dataset.id === field) {
      el.dataset.order = order;
    } else {
      delete el.dataset.order;
    }
  });
}

private addEventListeners(): void {
  if (!this.element) return;

  const header = this.element.querySelector('[data-element="header"]');
  if (!header) return;

  this.handleHeaderClick = (event: Event) => {
    const column = (event.target as HTMLElement)
      .closest('[data-sortable="true"]') as HTMLElement | null;

    if (!column) return;

    const field = column.dataset.id;
    if (!field) return;

    const currentOrder = column.dataset.order as SortOrder | undefined;
    const newOrder: SortOrder = currentOrder === 'desc' ? 'asc' : 'desc';

    this.sort(field, newOrder);
  };

  header.addEventListener('pointerdown', this.handleHeaderClick);
	}
	
  remove(): void {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy(): void {
    if (this.element) {
      const header = this.element.querySelector('[data-element="header"]');
      if (header && this.handleHeaderClick) {
        header.removeEventListener('pointerdown', this.handleHeaderClick);
      }
    }

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
      <a href="/products/${row['id'] ?? ''}" class="sortable-table__row">
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