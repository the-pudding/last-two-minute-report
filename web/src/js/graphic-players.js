import * as d3 from 'd3'
import './utils/includes-polyfill'
import colors from './colors'

const graphic = d3.select('.graphic__players')
const chart = graphic.select('.graphic__chart')

const margin = { top: 12, right: 12, bottom: 36, left: 36 }
const FONT_SIZE = 13
const RECT_HEIGHT = 8
const MARGIN = RECT_HEIGHT / 2

const ITEM_HEIGHT = FONT_SIZE + RECT_HEIGHT + MARGIN * 3

let scale
let scaleAxis
let svg
let playerData

function formatPercent(num) {
	return d3.format('.1%')(num)
}

function cleanData(row) {
	const player = row.player
	const against_total = +row.count_against
	const against_ic = +row.count_against_ic
	const against_inc = +row.count_against_inc
	const for_total = +row.count_for
	const for_ic = +row.count_for_ic
	const for_inc = +row.count_for_inc
	const net = +row.net
	const total = against_total + for_total
	const against_rate = against_total / total
	const for_rate = for_total / total
	// return { player, total, against_total, for_total, net, against_rate, for_rate }
	return { player, total, against_total, for_total, for_ic, for_inc, against_ic, against_inc }
}

function prepareData(data) {
	return data.filter(d => d.total > 15)
}

function createChart() {
	// setup scales
	const maxAgainst = d3.max(playerData, d => d.against_total)
	const maxFor = d3.max(playerData, d => d.for_total)
	const max = Math.max(maxFor, maxAgainst)

	scale = d3.scaleLinear().domain([0, max])
	scaleAxis = d3.scaleLinear().domain([-max, max])

	svg = chart.append('svg')

	const g = svg.append('g')

	g.attr('transform', `translate(${margin.left},${margin.top})`)

	// axis
	g.append('g')
		.attr('class', 'axis axis--x')
		.attr('transform', 'translate(0, 10)')

	const label = svg.append('g').attr('class', 'labels')

	label.append('text')
		.attr('class', 'label--x')
		.text('Seconds left')
			.attr('text-anchor', 'middle')

	// players
	const groupPlayers = g.append('g')
		.attr('class', 'g-players')

	const player = groupPlayers.selectAll('.player')
		.data(playerData)
		.enter().append('g')
			.attr('class', 'player')

	player.append('text')
		.text(d => d.player)
		.attr('class', 'name')
		.attr('text-anchor', 'middle')

	const keys = (['against_ic', 'against_inc', 'for_inc', 'for_ic'])

	keys.forEach((key) => {
		player.append('g')
			.attr('class', `g-${key}`)
			.datum(d => d[key])
			.append('rect')
			.attr('class', () => key.replace('_', '--'))
	})
}

function resize() {
	const width = chart.node().offsetWidth - (margin.left + margin.right)
	const height = (playerData.length * ITEM_HEIGHT) + ITEM_HEIGHT / 2
	const middle = width / 2

	svg
		.attr('width', width + (margin.left + margin.right))
		.attr('height', height + (margin.top + margin.bottom))

	scale.rangeRound([0, middle])
	scaleAxis.rangeRound([0, width])

	svg.select('.axis--x')
		.call(d3.axisTop(scaleAxis).tickSize(-height))
		.selectAll('text')

	svg.select('.label--x')
		.attr('transform', `translate(${middle},0)`)

	const player = svg.selectAll('.player')

	player.attr('transform', (d, i) => `translate(0,${ITEM_HEIGHT * (i + 1)})`)

	player.select('.name')
		.attr('transform', `translate(${middle}, 0)`)

	const keys = (['against_ic', 'against_inc', 'for_inc', 'for_ic'])

	keys.forEach((key) => {
		player.select(`.g-${key}`)
		.attr('transform', (d) => {
			const inc = key.includes('inc')
			const against = key.includes('against')
			const val = d[key]
			const otherKey = inc ? key.replace('inc', 'ic') : key.replace('ic', 'inc')
			const otherVal = d[otherKey]

			let x = middle
			if (inc) {
				// inc
				if (against) {
					x = x - scale(val)
				}
			} else {
				// ic
				if (against) {
					x = x - scale(val) - scale(otherVal)
				} else {
					x = x + scale(otherVal)
				}
			}
			return `translate(${x}, 0)`
		})
		.select('rect')
			.attr('width', d => scale(d[key]))
			.attr('height', RECT_HEIGHT)
			.attr('x', 0)
			.attr('y', MARGIN)
	})

	// svg.select('.g-against_ic')
	// 	.attr('x', d => scale.x(d.data.bin))
	// 	.attr('y', d => scale.y(d[1]))
	// 	.attr('height', 10)
	// 	.attr('width', d => d.scale.against(d[0]))
}

function init() {
	d3.csv('assets/data/web_players.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		playerData = prepareData(data)
		createChart()
		resize()
	})
}

export default { init }
