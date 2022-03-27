import { derived, writable, Writable } from 'svelte/store'

import IField from "../interfaces/IField";

import type { numSquare, lineOrdinate, numField } from "../types";

export default class Board {
	#board: Writable<any[]>;// Array<IField>

	constructor() {
		this.#board = writable([])
		this.fillBoard(true);
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

	setField(f: numField, field: IField) {	
    		this.#board.update(board => {
			board.splice(f, 1, field)
			return board
		});
	}

	setFieldToSquare(s: numSquare, f: numField, field: IField) {
		let numberFirstSquareField =  this.getFirstFieldNumberBySquareNumber(s);
		const rowOfSquare = Math.floor(f / 3);
		const n = numberFirstSquareField + (rowOfSquare * 9 + (f % 3))
		this.setField(n, field)
	}	
	
	getField (f: numField) {
		if (f >=0 && f < (9*9)) {
			let res;
			this.#board.subscribe(b => res = b)
			return res[f]
		} else return 0
	}



		probeGetField (index: number) {

			let currentProbe = 1;
			let usedNumbers = [];
			let num = 0;

			do{
				num = Math.floor(Math.random() * 9) + 1;
				
				if (usedNumbers.includes(num)) continue;
				
				if (!this.checkSquareByField(index, num)) {
					if (!this.checkLineByField("x", index, num)
					    && !this.checkLineByField("y", index, num)) {
						    this.setField(index, {v: num, x: num});

						    if (index < 80) {

							    const [nextProbe, result] = this.probeGetField(index + 1);
							    currentProbe = nextProbe + 1;//currentProbe;
							    
							    if(result == 0) {
								    this.setField(index, {v:0, x:0})
							    } else return [currentProbe, num]
								    
						    } else {
							    return [currentProbe, num]
						    }
					}
				}
				
				usedNumbers.push(num);
				num = 0;

			} while ( usedNumbers.length < 9)

			return [currentProbe, 0]
		}
	fillBoard(isNewBoard = false) {

		this.#board.update(_ => Array(9 * 9).fill(0))

		this.probeGetField(0);
		this.hideFields();
	}

	hideFields(difficult=[4,6]) {
		for(let square = 0; square < 9;  square++) {
			for (let countShowsFields =  Math.floor(Math.random() * (difficult[1] - difficult[0] + 1)) + difficult[0]]; countShowsFields > 0; countShowsFields--) {
				this.setFieldToSquare(square, Math.floor(Math.random() * (8 + 1)), {v:0, x:0})
			}
		}
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
