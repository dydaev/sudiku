import { derived, writable, Writable } from 'svelte/store'

export default class Settings {
	#settings: Writable<any>;
	//#levels: Writable<any>;
	//
	#langs: Array<string> = ["en", "ua"]

	#levels: Array<string> = ["low", "med", "hig"];


	constructor() {
		this.#settings = writable({
			lang: 0,
			level: "medium"
		})

		//this.initial();
	}

	get settings() {
		return this.#settings;
	}

	getSetting(name: string) {
		let res;
		this.#settings.subscribe(settings => res = settings[name]);
		return res;
	}

	setSetting(name: string, value: any){
		this.#settings.update(settings => ({ ...settings, [name]: value }));
	}

	getLangs() {
		return this.#langs;
	}

	getLevels() {
		return this.#levels;
	}

	getLevel(name: string): [number, number] {
		switch (name){
			case "height":
				return [6, 8];
			break;
			case "medium":
				return [4, 6];
			break;
			case "low":
				return [2, 4];
			break;
			default:
				return [4,6];

		}
	}
}
