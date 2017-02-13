import * as d3 from 'd3'
import teamLookup from './team-lookup'
import colors from './colors'

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

function createChart(data) {
	const teamData = data
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

function createChart2(data) {
	const scale = d3.scaleThreshold()

	scale
		.domain([1, 2, 4])
		.range(colors.sequentialRed)

	const team = chart.selectAll('.team')
		.data(data)
	.enter().append('div')
		.attr('class', 'team')

	team.append('img')
		.attr('class', 'team__logo')
		.attr('src', d => `assets/logos/${d.team}@2x.jpg`)

	team.selectAll('.game')
		.data(d => d.games)
		.enter().append('span')
			.attr('class', 'game')
			.style('background-color', d => scale(+d.incorrect))

}

function test(teamData) {
	loadGames((err, data) => {
		// console.log(data)
		const teams = teamData.map(t => {
			const team = t.team
			return {
				team,
				games: data.filter(d => d.home === team || d.away === team),
			}
		})
		
		createChart2(teams)
	})
}

function loadGames(cb) {
	d3.csv('assets/data/web_games.csv', (err,  data) => {
		cb(null, data)
	})
}


function init() {
	d3.csv('assets/data/web_teams.csv', cleanData, (err, data) => {
		if (err) console.error(err)
		createChart(data)
		// test(data)
	})
}

export default { init }
