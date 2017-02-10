import * as d3 from 'd3'
import './utils/includes-polyfill'
import colors from './colors'

const graphic = d3.select('.graphic__players')
const chart = graphic.select('.graphic__chart')

function cleanData(row) {
	return {
		...row,
		against_total: +row.count_against,
		against_ic: +row.count_against_ic,
		against_inc: +row.count_against_inc,
		for_total: +row.count_for,
		for_ic: +row.count_for_ic,
		for_inc: +row.count_for_inc,
		net: +row.net,
		total: +row.count_against + +row.count_for,
	}
}

function createTable(data) {
	const playerData = data
		.filter(d => d.total > 10)
		.sort((a, b) => d3.descending(a.net / a.total, b.net / b.total))

	// const scale = d3.scaleThreshold()

	// scale
	// 	.domain([.2, .4, .6, .8])
	// 	.range(colors.diverging)

	// const tableEnter = chart.append('table')
	// 	.attr('class', 'calls__table')

	// const headEnter = tableEnter.append('thead')
	// 	.append('tr')

	// headEnter.append('th').text('Call').classed('text', true)
	// headEnter.append('th').text('CC').classed('number', true)
	// headEnter.append('th').text('IC').classed('number', true)
	// headEnter.append('th').text('INC').classed('number', true)
	// headEnter.append('th').text('Rate correct').classed('number', true)

	// const bodyEnter = tableEnter.append('tbody')

	// const trEnter = bodyEnter.selectAll('tr')
	// 	.data(callData)
	// 	.enter().append('tr')

	// trEnter.style('background-color', d => scale(d.rate_correct))

	// trEnter.append('td').text(d => d.call).classed('text', true)
	// trEnter.append('td').text(d => formatComma(d.cc)).classed('number', true)
	// trEnter.append('td').text(d => formatComma(d.ic)).classed('number', true)
	// trEnter.append('td').text(d => formatComma(d.inc)).classed('number', true)
	// trEnter.append('td').text(d => formatPercent(d.rate_correct)).classed('number', true)

}

function init() {
	d3.csv('assets/data/web_players.csv', cleanData, (err,  data) => {
		if (err) console.error(err)
		createTable(data)
	})
}

export default { init }
