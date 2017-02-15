import * as d3 from 'd3'
import './utils/includes-polyfill'
import { jumpTo } from './utils/dom'
import colors from './colors'

const graphic = d3.select('.graphic__recent')
const chart = graphic.select('.graphic__chart')
const button = graphic.select('.button--expand')

let mobile = false


function formatDate(str) {
	const parsed = d3.timeParse('%Y%m%d')(str)
	return d3.timeFormat('%b. %d, %Y')(parsed)
}

function formatTime(str) {
	const secondsLeft = +str
	const minutes = Math.floor(secondsLeft / 60)
	const rem = secondsLeft - (minutes * 60)
	const seconds = d3.format('0.1f')(rem)
	const pre = rem < 10 ? '0' : ''
	return `${minutes}:${pre}${seconds}`
}

function handleNav(dir, el) {
	const button = d3.select(el)
	const otherEl = dir === 1 ? el.previousElementSibling : el.nextElementSibling
	const otherButton = d3.select(otherEl)

	const game = d3.select(el.parentNode.parentNode)
	// find current selected
	const tr = game.selectAll('tbody tr')

	const prev = game.select('.is-visible')
	tr.classed('is-visible', false)

	// right
	let next
	if (dir === 1) {
		next = prev.node().nextElementSibling
		if (next) {
			const stillRight = next.nextElementSibling
			if (stillRight) button.classed('is-disable', false)
			else button.classed('is-disable', true)
			otherButton.classed('is-disable', false)
		}
	} else {
		next = prev.node().previousElementSibling
		if (next) {
			const stillLeft = next.previousElementSibling
			if (stillLeft) button.classed('is-disable', false)
			else button.classed('is-disable', true)
			otherButton.classed('is-disable', false)	
		}
	}

	if (next) d3.select(next).classed('is-visible', true)
	else prev.classed('is-visible', true)

}

function createTable({ gameData, playsData }) {
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

	infoEnter.append('p')
		.attr('class', 'info__date')
		.text(d => formatDate(d.date))

	const matchup = infoEnter.append('div')
		.attr('class', 'info__matchup')

	const away = matchup.append('div')
		.attr('class', 'info__team')

	away.append('img')
		.attr('src', d => `assets/logos/${d.away}@2x.jpg`)

	away.append('p')
		.text(d => d.score_away)

	matchup.append('span')
		.text('@')

	const home = matchup.append('div')
		.attr('class', 'info__team')

	home.append('img')
		.attr('src', d => `assets/logos/${d.home}@2x.jpg`)

	home.append('p')
		.text(d => d.score_home)

	const nav = gameEnter.append('div')
		.attr('class', 'game__nav')

	nav.append('button')
		.attr('class', 'nav__button button--left is-disable')
		.html('&larr;')
		.on('click', (d, i, nodes) => handleNav(-1, nodes[0]))

	nav.append('button')
		.attr('class', 'nav__button button--right')
		.html('&rarr;')
		.on('click', (d, i, nodes) => handleNav(1, nodes[0]))

	const tableEnter = gameEnter.append('table')
		.datum(d => d.values)
		.attr('class', 'game__plays')

	const headEnter = tableEnter.append('thead')
		.append('tr')

	headEnter.append('th').text('Period')
	headEnter.append('th').text('Time')
	headEnter.append('th').text('Call')
	headEnter.append('th').text('Committing player')
	headEnter.append('th').text('Disadvantaged player')
	headEnter.append('th').text('Review decision')

	const bodyEnter = tableEnter.append('tbody')

	const trEnter = bodyEnter.selectAll('tr')
		.data(d => d)
		.enter().append('tr')

	trEnter.append('td').text(d => d.period)
		.attr('data-title', 'Period')

	trEnter.append('td').text(d => formatTime(d.seconds_left))
		.attr('data-title', 'Time')

	trEnter.append('td')
		.attr('data-title', 'Call')
		.append('a')
		.text(d => d.call_type)
		.attr('href', d => d.video)
		.attr('target', '_blank')

	trEnter.append('td').html((d) => {
		const p = d.committing_player
		const t = d.committing_team
		const team = t ? `${t}` : ''
		return `<span>${team}</span> ${p}`
	}).attr('class', 'td--committing')
		.attr('data-title', 'Committing')

	trEnter.append('td').html((d) => {
		const p = d.disadvantaged_player
		const t = d.disadvantaged_team
		const team = t ? `${t}` : ''
		return `<span>${team}</span> ${p}`
	}).attr('class', 'td--disadvantaged')
	.attr('data-title', 'Disadvantaged')

	trEnter.append('td').text(d => d.review_decision)
		.style('background-color', d => {
			const r = d.review_decision
			return r ? colors.ordinal[r.toLowerCase()] : colors.ordinal['default']
		})
		.attr('data-title', 'Review Decision')
}

function handleButton() {
	const visible = chart.classed('is-visible')
	const text = visible ? 'Expand to see all' : 'Collapse'
	chart.classed('is-visible', !visible)
	button.text(text)
	if (visible) jumpTo(chart.node())
}

function setupEvents() {
	button.on('click', handleButton)
}

function loadGameData(cb) {
	d3.csv('assets/data/web_games.csv', (err, data) => {
		if (err) console.error(err)
		cb(null, data)
	})
}

function loadRecentData(cb) {
	d3.csv('assets/data/web_recent.csv', (err, data) => {
		if (err) console.error(err)
		cb(null, data)
	})
}

function resize() {
	mobile = !window.matchMedia('(min-width: 50em)').matches
	if (mobile) {
		const games = chart.selectAll('.game')
		games.select('tbody tr').classed('is-visible', true)
	}
}

function init() {
	setupEvents()

	d3.queue()
		.defer(loadGameData)
		.defer(loadRecentData)
		.awaitAll((err, data) => {
			createTable({ gameData: data[0], playsData: data[1] })
			resize()		
		})
}

export default { init, resize }
