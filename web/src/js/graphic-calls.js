import * as d3 from 'd3'
import colors from './colors'
import './utils/find-index-polyfill'

const colorsLight = {}

const graphic = d3.select('.graphic__calls')
const chart = graphic.select('.graphic__chart')

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

function getRange({ key, selected }) {
	switch (key) {
	case 'cc':
		return selected ? colors.sequentialGreen : colorsLight.sequentialGreen
	case 'ic':
		return selected ? colors.sequentialRed : colorsLight.sequentialRed
	case 'inc':
		return selected ? colors.sequentialRed : colorsLight.sequentialRed
	case 'rate':
		return selected ? colors.diverging : colorsLight.diverging
	default:
		return colors.diverging
	}
}

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
		const range = getRange({ key, selected })

		scale[key].range(range)
		chart.selectAll(`.td-${key}`)
			.style('background-color', d => scale[key](d[key]))
			.classed('is-selected', selected)

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

function createTable() {
	const tableEnter = chart.append('table')

	const headEnter = tableEnter.append('thead')
		.append('tr')

	headEnter.append('th')
		.attr('class', 'th-call')
		.text('Call')
		.classed('text', true)

	headEnter.append('th')
		.attr('class', 'th-cc')
		.attr('data-col', 'cc')
		.text('CC')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-ic')
		.attr('data-col', 'ic')
		.text('IC')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-inc')
		.attr('data-col', 'inc')
		.text('INC')
		.classed('number', true)
		.on('click', handleColumnClick)

	headEnter.append('th')
		.attr('class', 'th-rate')
		.attr('data-col', 'rate')
		.text('% Correct')
		.classed('number', true)
		.classed('descending', true)
		.on('click', handleColumnClick)

	const bodyEnter = tableEnter.append('tbody')

	const trEnter = bodyEnter.selectAll('tr')
		.data(callData, (d, i) => i)
		.enter().append('tr')

	// trEnter.style('background-color', d => scale(d.rate))

	trEnter.append('td')
		.attr('class', 'td-call')
		.classed('text', true)

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

function prepareData(data) {
	return data.filter(d => d.total_infraction >= 20)
}

function setupEvents() {
	const cols = ['cc', 'ic', 'inc', 'rate']
	d3.select('.graphic__calls .button--swap').on('click', () => {
		const col = chart.select('th.is-selected').attr('data-col')
		const index = cols.findIndex(d => d === col) + 1
		const next = index < cols.length ? index : 0
		const nextCol = cols[next]
		chart.selectAll('th').classed('is-selected', false)
		chart.selectAll('td').classed('is-selected', false)
		chart.selectAll(`.th-${nextCol}`).classed('is-selected', true)
		chart.selectAll(`.td-${nextCol}`).classed('is-selected', true)
		updateTable({ col: nextCol, order: 'descending' })
	})
}

function init() {
	colorsLight.diverging = colors.diverging.map(lighten)
	colorsLight.sequentialRed = colors.sequentialRed.map(lighten)
	colorsLight.sequentialGreen = colors.sequentialGreen.map(lighten)

	d3.csv('assets/data/web_calls.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		callData = prepareData(data)
		scale = createScale(callData)
		createTable()
		setupEvents()
		updateTable({ col: 'rate', order: 'descending' })
	})
}

export default { init }
