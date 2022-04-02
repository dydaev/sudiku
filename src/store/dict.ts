
export default () => {

	const dict = {
		"s_err": ["Show errors", "Показати похибки"],
		"new_g": ["New game", "Нова гра"],
		"low":["Low", "Легкий"],
		"medium":["Medium", "Середнiй"],
		"height":["Hight", "Важкий"],
		"hard": ["Hard", "Дуже важкий"],
		"sett":["Settings", "Налаштунки"],
		"lev":["Level", "Рiвень"],
		"score":["Scores", "Статистика"],
		"":["", ""],
		//"":["", ""],
	}

	return (word, lang) => dict[word][lang];
}
