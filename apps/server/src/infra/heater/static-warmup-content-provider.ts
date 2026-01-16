import type { WarmUpContentProvider } from "../../application/heater/content/warmup-content-provider";

export class StaticWarmUpContentProvider implements WarmUpContentProvider {
	private readonly texts: readonly string[];
	private nextIndex = 0;

	constructor(texts: readonly string[] = ["kkk", "boa", "vdd", "entendi"]) {
		this.texts = texts.length > 0 ? texts : ["kkk"];
	}

	randomText(): string {
		const text = this.texts[this.nextIndex % this.texts.length]!;
		this.nextIndex += 1;
		return text;
	}
}

