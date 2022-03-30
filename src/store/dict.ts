
export default () => {

	const dict = {
		"new_g": ["New game", "Нова гра"],
		"low":["Low", "Легкий"],
		"med":["Medium", "Середнiй"],
		"hig":["Hight", "Важкий"],
		"sett":["Settings", "Налаштунки"],
		"lev":["Level", "Рiвень"],
		"":["", ""],
		//"":["", ""],
	}

	return (word, lang) => dict[word][lang];
}
