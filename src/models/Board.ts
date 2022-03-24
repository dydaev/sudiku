import { derived, writable, Writable } from 'svelte/store'

import IField from "../interfaces/IField";

import type { numSquare, lineOrdinate, numField } from "../types";

export default class Board {
	#board: Writable<any[]>;// Array<IField>

	constructor() {
		this.#board = writable([])
		this.generateNewBoard();
	}

	get squares() {
		const squares =  Array(9).fill(0).map((_, num: number) => {
			let res
			this.getSquareByNumber(num).subscribe(s => res = s)
			return res
		});
		return squares
	}

	get showBoard() {
		return derived(this.#board, $board => $board.map(field => field.v))
	}

	generateNewBoard() {

    		const board = Array(9*9).fill(1).map((_, ind) => ({
			v: ind+1,
			x: ind+1
		}))

		this.#board.update(_ => board) 
	}

	getLineByField (l: lineOrdinate, f: numField){
		return derived(this.#board, $board => $board.reduce((acc, field, ind) => {
			if (l == "y") {
				if (ind % 9 === f % 9) return [...acc, field];
			} else {
				if (Math.floor(ind/9) === Math.floor(f/9)) return [...acc, field];
			}
			return acc;
		}, []))
	}
	
	/*getLineByNumber (l: numLine, n: number): ILine {

	}*/

       getSquareByField (f: numField) {
		const minX = Math.floor((f % 9)/3) * 3;
		const minY = Math.floor(Math.floor(f / 9) / 3) * 3;
		return derived(this.#board ,$board => {
			return $board.reduce((acc, field, ind) => {
			if ( ind % 9 >= minX && ind % 9 <= (minX + 2) 
			    && (Math.floor(ind/9) >= minY && Math.floor(ind/9) <= (minY + 2)))
		    	    return [...acc, field]
			return acc;
		}, [])})
       }

       getSquareByNumber (n: number) {
	       return this.getSquareByField((n * 3) + Math.floor(n/3) * 18)
       }
}
