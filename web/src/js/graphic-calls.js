import * as d3 from 'd3'
import './utils/includes-polyfill'
import colors from './colors'

const graphic = d3.select('.graphic__calls')
const chart = graphic.select('.graphic__chart')

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
	const rate_correct = (cc) / total_infraction
	const rate_incorrect = 1 - rate_correct
	return { call, cc, cnc, ic, inc, total, total_infraction, rate_correct, rate_incorrect }
}

function loadCalls(cb) {
	d3.csv('assets/data/web_calls.csv', cleanData, (err,  data) => {
		cb(null, data)
	})
}

function createTable(err, data) {
	if (err) console.error(err)
	const callData = data[0]
		.filter(d => d.total_infraction > 20)
		.sort((a, b) => d3.descending(a.rate_correct, b.rate_correct))

	const scale = d3.scaleThreshold()

	scale
		.domain([.2, .4, .6, .8])
		.range(colors.diverging)

	const tableEnter = chart.append('table')
		.attr('class', 'calls__table')

	const headEnter = tableEnter.append('thead')
		.append('tr')

	headEnter.append('th').text('Call').classed('text', true)
	headEnter.append('th').text('CC').classed('number', true)
	headEnter.append('th').text('IC').classed('number', true)
	headEnter.append('th').text('INC').classed('number', true)
	headEnter.append('th').text('Rate correct').classed('number', true)

	const bodyEnter = tableEnter.append('tbody')

	const trEnter = bodyEnter.selectAll('tr')
		.data(callData)
		.enter().append('tr')

	trEnter.style('background-color', d => scale(d.rate_correct))

	trEnter.append('td').text(d => d.call).classed('text', true)
	trEnter.append('td').text(d => formatComma(d.cc)).classed('number', true)
	trEnter.append('td').text(d => formatComma(d.ic)).classed('number', true)
	trEnter.append('td').text(d => formatComma(d.inc)).classed('number', true)
	trEnter.append('td').text(d => formatPercent(d.rate_correct)).classed('number', true)

}

function init() {
	const q = d3.queue()
	q
		.defer(loadCalls)
		.awaitAll(createTable)
}

export default { init }
