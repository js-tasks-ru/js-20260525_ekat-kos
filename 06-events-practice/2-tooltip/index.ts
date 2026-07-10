import { createElement } from "../../shared/utils/create-element";

export default class Tooltip {
	static instance: Tooltip | null = null;
	element: HTMLElement | null = null;

	constructor() {

		if (Tooltip.instance) {
			return Tooltip.instance
		}

		Tooltip.instance = this;
		
		this.initialize()
	}

	private onPointerOver = (event: Event) => {
			const target = event.target as HTMLElement
			const text = target.dataset.tooltip
	
			if (text) {
				this.render(text)
			}
	}
	
  private onPointerOut = () => {
    this.remove();
	};
	
	initialize() {
    document.addEventListener("pointerover", this.onPointerOver);
    document.addEventListener("pointerout", this.onPointerOut);
	}

	render(text: string): void {
		this.remove()
		this.element = createElement(this.template(text));
		document.body.append(this.element)
	}

	private remove() {
		if (this.element) {
			this.element.remove()
			this.element = null
		}
	}

	destroy(): void {
		document.removeEventListener("pointerover", this.onPointerOver);
		document.removeEventListener("pointerout", this.onPointerOut);
		
		this.remove()

		Tooltip.instance = null;
	}
	
	private template(text: string): string { 
    return `
    <div class="tooltip">${text}</div>
    `;
	}
}
