import { createElement } from "../../shared/utils/create-element";

type DoubleSliderSelected = {
  from: number;
  to: number;
};

interface Options {
  min?: number;
  max?: number;
  formatValue?: (value: number) => string;
  selected?: DoubleSliderSelected;
}

export default class DoubleSlider {
  element: HTMLElement | null = null;
  min: number;
  max: number;
  selected: DoubleSliderSelected;

  private dragging: HTMLElement | null = null;

  constructor(private options: Options = {}) {
    this.min = this.options.min ?? 0;
    this.max = this.options.max ?? 100;
    this.selected = this.options.selected ?? {
      from: this.min,
      to: this.max
    };

    this.render();
    this.addEventListeners();
  }

  destroy(): void {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  private formatValue(value: number): string {
    return this.options.formatValue
      ? this.options.formatValue(value)
      : String(value);
  }

  private render(): void {
    this.element = createElement(this.template());
  }

  private addEventListeners(): void {
    const thumbLeft = this.element?.querySelector<HTMLElement>('.range-slider__thumb-left');
    const thumbRight = this.element?.querySelector<HTMLElement>('.range-slider__thumb-right');

    thumbLeft?.addEventListener('pointerdown', this.onThumbPointerDown);
    thumbRight?.addEventListener('pointerdown', this.onThumbPointerDown);
  }

  private onThumbPointerDown = (event: PointerEvent) => {
    event.preventDefault();

    this.dragging = event.target as HTMLElement;

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging || !this.element) return;

    const inner = this.element.querySelector<HTMLElement>('.range-slider__inner');
    if (!inner) return;

    const { left, width } = inner.getBoundingClientRect();

    let ratio = (event.clientX - left) / width;
    ratio = Math.max(0, Math.min(1, ratio));
    const value = Math.round(this.min + ratio * (this.max - this.min));

    if (this.dragging.classList.contains('range-slider__thumb-left')) {
      this.selected.from = Math.min(value, this.selected.to);
    } else {
      this.selected.to = Math.max(value, this.selected.from);
    }

    this.updateSlider();
  };

  private onPointerUp = () => {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    this.dragging = null;
    this.dispatchEvent();
  };

  private updateSlider(): void {
    if (!this.element) return;

    const leftPercent = ((this.selected.from - this.min) / (this.max - this.min)) * 100;
    const rightPercent = ((this.max - this.selected.to) / (this.max - this.min)) * 100;

    const thumbLeft = this.element.querySelector<HTMLElement>('.range-slider__thumb-left');
    const thumbRight = this.element.querySelector<HTMLElement>('.range-slider__thumb-right');
    const progress = this.element.querySelector<HTMLElement>('.range-slider__progress');
    const fromLabel = this.element.querySelector<HTMLElement>('[data-element="from"]');
    const toLabel = this.element.querySelector<HTMLElement>('[data-element="to"]');

    if (thumbLeft) thumbLeft.style.left = `${leftPercent}%`;
    if (thumbRight) thumbRight.style.right = `${rightPercent}%`;
    if (progress) {
      progress.style.left = `${leftPercent}%`;
      progress.style.right = `${rightPercent}%`;
    }
    if (fromLabel) fromLabel.textContent = this.formatValue(this.selected.from);
    if (toLabel) toLabel.textContent = this.formatValue(this.selected.to);
  }

  private dispatchEvent(): void {
    const event = new CustomEvent('range-select', {
      bubbles: true,
      detail: {
        from: this.selected.from,
        to: this.selected.to
      }
    });
    this.element?.dispatchEvent(event);
  }

  private template(): string {
    const leftPercent = ((this.selected.from - this.min) / (this.max - this.min)) * 100;
    const rightPercent = ((this.max - this.selected.to) / (this.max - this.min)) * 100;

    return `
      <div class="range-slider">
        <span data-element="from">${this.formatValue(this.selected.from)}</span>
        <div class="range-slider__inner">
          <span class="range-slider__progress" style="left: ${leftPercent}%; right: ${rightPercent}%"></span>
          <span class="range-slider__thumb-left" style="left: ${leftPercent}%"></span>
          <span class="range-slider__thumb-right" style="right: ${rightPercent}%"></span>
        </div>
        <span data-element="to">${this.formatValue(this.selected.to)}</span>
      </div>
    `;
  }
}