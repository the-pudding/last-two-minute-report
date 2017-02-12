import * as d3 from 'd3'
import './utils/includes-polyfill'
import colors from './colors'

let colorsLight

const graphic = d3.select('.graphic__players')
const chart = graphic.select('.graphic__chart')

let scale
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
	return { player, total, against_total, for_total, net, against_rate, for_rate }
}

function createScale(data) {
	return {
		for_total: d3.scaleQuantile().domain(data.map(d => d.for_total)),
		against_total: d3.scaleQuantile().domain(data.map(d => d.against_total)),
		net: d3.scaleQuantile().domain(data.map(d => d.net)),
		rate_for: d3.scaleThreshold().domain([0.2, 0.4, 0.6, 0.8]),
	}
}

// function updateTable() {
// 	const playerData = data
// 		.sort((a, b) => d3.descending(a.net / a.total, b.net / b.total))
// }

function updateTable({ col, order }) {
	const sortedData = callData.sort((a, b) => d3[order](a[col], b[col]))

	const tr = chart.selectAll('tbody tr')
		.data(sortedData, (d, i) => i)

	tr.select('.td-cc').text(d => formatComma(d.cc))
	tr.select('.td-ic').text(d => formatComma(d.ic))
	tr.select('.td-inc').text(d => formatComma(d.inc))
	tr.select('.td-rate').text((d, i) => {
		const p = formatPercent(d.rate)
		if (i > 0) return p.replace(/\%/, '')
		return p
	})
	tr.select('.td-call').text(d => d.call)

	chart.selectAll('th')
		.classed('descending', false)
		.classed('ascending', false)
	Object.keys(scale).forEach((key) => {
		const selected = key === col
		const range = selected ? colors.diverging : colorsLight

		scale[key].range(range)
		chart.selectAll(`.td-${key}`)
			.style('background-color', d => scale[key](d[key]))

		const th = chart.select(`.th-${key}`)

		th.classed('is-selected', selected)

		if (selected) {
			const reverse = order === 'ascending' ? 'descending' : 'ascending'
			th.classed(order, true)
			th.classed(reverse, false)
		}
	})
}

function handleColumnClick() {
	const sel = d3.select(this)
	const col = sel.attr('data-col')
	const order = sel.classed('descending') ? 'ascending' : 'descending'
	updateTable({ col, order })
}

function createTable(data) {
	const tableEnter = chart.append('table')

	const headEnter = tableEnter.append('thead')
		.append('tr')

	headEnter.append('th')
		.attr('class', 'th-name')
		.text('name')
		.classed('text', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-in-favor')
		.text('In favor')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-against')
		.text('Against')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'Net')
		.text('Net')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-in-favor-pct')
		.text('In favor %')
		.classed('number', true)
		.on('click', handleColumnClick)


	const bodyEnter = tableEnter.append('tbody')

	const trEnter = bodyEnter.selectAll('tr')
		.data(playerData, (d, i ) => i)
		.enter().append('tr')

	// trEnter.style('background-color', d => scale(d.for_rate))

	trEnter.append('td')
		.attr('class', 'td-name')
		.text(d => d.player)
		.classed('text', true)

	trEnter.append('td')
		.attr('class', 'td-for')
		.text(d => d.for_total)
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-against')
		.text(d => d.against_total)
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-net')
		.text(d => d.net)
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-for-pct')
		.text(d => formatPercent(d.for_rate))
		.classed('number', true)
}

function prepareData(data) {
	return data.filter(d => d.total > 15)
}

function init() {
	d3.csv('assets/data/web_players.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		playerData = prepareData(data)
		scale = createScale(playerData)
		createTable()
		// updateTable({ col: 'rate', order: 'descending' })
	})
}

export default { init }
