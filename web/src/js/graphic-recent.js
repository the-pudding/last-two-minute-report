import * as d3 from 'd3'
import './utils/includes-polyfill'

const graphic = d3.select('.graphic__recent')
const chart = graphic.select('.graphic__chart')

function formatDate(str) {
	const parsed = d3.timeParse('%Y%m%d')(str)
	return d3.timeFormat('%b. %d, %Y')(parsed)
}

function cleanData(row) {
	return {
		...row,
	}
}

function loadGames(cb) {
	d3.csv('assets/data/web_games.csv', cleanData, (err,  data) => {
		cb(null, data)
	})
}

function loadRecent(cb) {
	d3.csv('assets/data/web_recent.csv', cleanData, (err,  data) => {
		cb(null, data)
	})
}

function formatTime(str) {
	const secondsLeft = +str
	const minutes = Math.floor(secondsLeft / 60)
	const rem = secondsLeft - (minutes * 60)
	const seconds = d3.format('0.1f')(rem)
	const pre = rem < 10 ? '0' : ''
	return `${minutes}:${pre}${seconds}`
}

function createTable(err, data) {
	const [gameData, playsData] = data

	// group plays by game
	const playsByGame = d3.nest()
		.key(d => d.game_id)
		.entries(playsData)

	// find the unique game ids from plays
	const gameIds = playsByGame.map(d => d.key)

	// filter games data to just recent
	const games = gameData.filter(d => gameIds.includes(d.game_id))
	const gamesDict = {}
	games.forEach(d => gamesDict[d.game_id] = d)


	const gameEnter = chart.selectAll('.game')
		.data(playsByGame)
		.enter().append('div')
		.attr('class', 'game')

	const infoEnter = gameEnter.append('div')
		.datum(d => gamesDict[d.key])
		.attr('class', 'game__info')

	infoEnter.append('a').text(d => {
		return `${d.away} (${d.score_away}) at ${d.home} (${d.score_home})`
	}).attr('href', d => d.box_score_url)
	infoEnter.append('p').text(d => formatDate(d.date))

	const tableEnter = gameEnter.append('table')
		.datum(d => d.values)
		.attr('class', 'game__plays')

	const headEnter = tableEnter.append('thead')
		.append('tr')

	headEnter.append('th').text('Period')
	headEnter.append('th').text('Time')
	headEnter.append('th').text('Call')
	headEnter.append('th').text('Review decision')
	headEnter.append('th').text('Committing player')
	headEnter.append('th').text('Disadvantaged player')

	const bodyEnter = tableEnter.append('tbody')

	const trEnter = bodyEnter.selectAll('tr')
		.data(d => d)
		.enter().append('tr')


	trEnter.attr('class', d => {
		const r = d.review_decision
		return r ? r.toLowerCase() : ''
	})

	trEnter.append('td').text(d => d.period)
	trEnter.append('td').text(d => formatTime(d.seconds_left))
	trEnter.append('td').append('a')
		.text(d => d.call_type)
		.attr('href', d => d.video)
		.attr('target', '_blank')
	trEnter.append('td').text(d => d.review_decision)
	trEnter.append('td').html((d) => {
		const p = d.committing_player
		const t = d.committing_team
		const team = t ? `${t}` : ''
		return `<span>${team}</span> ${p}`
	}).attr('class', 'td--committing')
	trEnter.append('td').html((d) => {
		const p = d.disadvantaged_player
		const t = d.disadvantaged_team
		const team = t ? `${t}` : ''
		return `<span>${team}</span> ${p}`
	}).attr('class', 'td--disadvantaged')
}

function init() {
	const q = d3.queue()
	q
		.defer(loadGames)
		.defer(loadRecent)
		.awaitAll(createTable)
}

export default { init }
