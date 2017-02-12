import * as d3 from 'd3'
import './utils/includes-polyfill'
import colors from './colors'

const graphic = d3.select('.graphic__calls')
const chart = graphic.select('.graphic__chart')
let colorsIndex
let colorsLight
let scale
let callData

function lighten(hex) {
	const color = d3.color(hex)
	color.opacity = 0.3
	return color.toString()
}

function formatPercent(num) {
	return d3.format('.1%')(num)
}

function formatComma(num) {
	return d3.format(',')(num)
}

function cleanData(row) {
	const call = row.call_type
	const cc = +row.count_cc
	const cnc = +row.count_cnc
	const ic = +row.count_ic
	const inc = +row.count_inc
	const total = cc + cnc + ic + inc
	const total_infraction = total - cnc
	const rate = cc / total_infraction
	// const rate_incorrect = 1 - rate_correct
	return { call, cc, cnc, ic, inc, total, total_infraction, rate }
}

function createScale(data) {
	return {
		cc: d3.scaleQuantile().domain(data.map(d => d.cc)),
		ic: d3.scaleQuantile().domain(data.map(d => d.ic)),
		inc: d3.scaleQuantile().domain(data.map(d => d.inc)),
		rate: d3.scaleThreshold().domain([0.2, 0.4, 0.6, 0.8]),
	}
}

function handleColumnClick(d) {
	const col = d3.select(this).attr('data-col')
	updateTable(col)
}

function createTable() {
	const tableEnter = chart.append('table')

	const headEnter = tableEnter.append('thead')
		.append('tr')

	headEnter.append('th')
		.text('Call')
		.classed('text', true)

	headEnter.append('th')
		.attr('data-col', 'cc')
		.text('CC')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('data-col', 'ic')
		.text('IC')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('data-col', 'inc')
		.text('INC')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('data-col', 'rate')
		.text('Rate correct')
		.classed('number', true)
		.on('click', handleColumnClick)

	const bodyEnter = tableEnter.append('tbody')

	const trEnter = bodyEnter.selectAll('tr')
		.data(callData, (d, i) => i)
		.enter().append('tr')

	// trEnter.style('background-color', d => scale(d.rate))

	trEnter.append('td').text(d => d.call).classed('text', true)

	trEnter.append('td')
		.attr('class', 'td-cc')
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-ic')
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-inc')
		.classed('number', true)

	trEnter.append('td')
		.attr('class', 'td-rate')
		.classed('number', true)
}

function updateTable(col) {
	const sortedData = callData.sort((a, b) => d3.descending(a[col], b[col]))

	const tr = chart.selectAll('tbody tr')
		.data(sortedData, (d, i) => i)

	tr.select('.td-cc').text(d => formatComma(d.cc))
	tr.select('.td-ic').text(d => formatComma(d.ic))
	tr.select('.td-inc').text(d => formatComma(d.inc))
	tr.select('.td-rate').text(d => formatPercent(d.rate))

	Object.keys(scale).forEach((key) => {
		const range = col === key ? colors.diverging : colorsLight
		scale[key].range(range)
		chart.selectAll(`.td-${key}`)
			.style('background-color', d => scale[key](d[key]))
	})
}

function prepareData(data) {
	return data.filter(d => d.total_infraction >= 20)
}
function init() {
	colorsIndex = colors.diverging.map((d, i) => i)
	colorsLight = colors.diverging.map(lighten)

	d3.csv('assets/data/web_calls.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		callData = prepareData(data)
		scale = createScale(callData)
		createTable()
		updateTable('rate')
	})
}

export default { init }
