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
		let res
		this.#board.subscribe(b => res = b)
		return res.map(f => typeof f == "object" && "v" in f ? f.v : f)
	}

	setField (f: numField, field: IField) {	
    		this.#board.update(board => {
			board.splice(f, 1, field)
			return board
		});
	}
	getField (f: numField) {
		if (f >=0 && f < (9*9)) {
			let res;
			this.#board.subscribe(b => res = b)
			return res[f]
		} else return 0
	}

	generateNewBoard() {

    		this.#board.update(_ => Array(9 * 9).fill(0))
		let probe = 0
		do {
		for (let ind = 0; ind < 9*9; ind++ ) {
			let usedNumbers = [];
			let num = 0;

			//if (ind > 0) console.log(this.getField(ind - 1))

			do {
				num = Math.floor(Math.random() * 9) + 1;

				if (usedNumbers.includes(num)) continue;

				if (!this.checkSquareByField(ind, num)) {
					if (!this.checkLineByField("x", ind, num) 
					    && !this.checkLineByField("y", ind, num)) {
						break;
					} else usedNumbers.push(num)
				} else usedNumbers.push(num)

			} while(usedNumbers.length < 9)

			if (usedNumbers.length < 9) {
				this.setField( ind,
				{
					v: num,
					x: num
				})
			} else {
				const currentSquareNum = this.getSquareNumberByFieldNumber(ind)

				/*if (currentSquareNum > 0)
					ind = this.getFirstFieldNumberBySquareNumber(currentSquareNum - 1)
				else
					ind = 0*/

			}

		}
		probe++;
		} while (this.showBoard.includes(0) && probe < 2)
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

	checkLineByField(l: lineOrdinate, f:numField, n:number): boolean{
		let line
		this.getLineByField(l, f).subscribe(l => line = l)
		return line.find(f => typeof f == "object" && "v" in f && f.v == n) != undefined
	}

	checkSquareByField(f:numField, n:number): boolean{
		let square
		this.getSquareByField(f).subscribe(s => square = s);
		return square.find(f => typeof f == "object" && "v" in f && f.v == n) != undefined
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

       getSquareNumberByFieldNumber(n: numField) {
	       return (Math.floor(n/3)%3) + ((Math.floor(n/27) * 3));
       }

	getFirstFieldNumberBySquareNumber(n: numSquare) {
		return ((n * 3) + Math.floor(n/3) * 18)
	}

       getSquareByNumber (n: number) {
	       return this.getSquareByField(this.getFirstFieldNumberBySquareNumber(n))
       }
}
