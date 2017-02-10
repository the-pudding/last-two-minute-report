import * as d3 from 'd3'
import teamLookup from './team-lookup'

const graphic = d3.select('.graphic__teams')
const chart = graphic.select('.graphic__chart')

function cleanData(row) {
	return {
		...row,
		count_against: +row.count_against,
		count_against_ic: +row.count_against_ic,
		count_against_inc: +row.count_against_inc,
		count_for: +row.count_for,
		count_for_ic: +row.count_for_ic,
		count_for_inc: +row.count_for_inc,
		net: +row.net,
	}
}

function loadTeams(cb) {
	d3.csv('assets/data/web_team.csv', cleanData, (err, data) => {
		cb(null, data)
	})
}

function createChart(err, data) {
	if (err) throw err

	const teamData = data[0]
	const team = chart.selectAll('.team')
		.data(teamData)
	.enter().append('div')
		.attr('class', 'team')

	// console.log(teamData)
	// team.append('p')
	// 	.text(d => d.team)
	team.append('img')
		.attr('class', 'team__logo')
		.attr('src', d => `assets/logos/${d.team}@2x.jpg`)
}
function init() {
	console.log(teamLookup)
	const q = d3.queue()
	q
		.defer(loadTeams)
		.awaitAll(createChart)
}

export default { init }
