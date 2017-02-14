import * as d3 from 'd3'
import teamLookup from './team-lookup'
import { jumpTo } from './utils/dom'
import colors from './colors'

const graphic = d3.select('.graphic__teams')
const chart = graphic.select('.graphic__chart')

let teamData

function formatTime(str) {
	const secondsLeft = +str
	const minutes = Math.floor(secondsLeft / 60)
	const rem = secondsLeft - (minutes * 60)
	const seconds = d3.format('0.1f')(rem)
	const pre = rem < 10 ? '0' : ''
	return `${minutes}:${pre}${seconds}`
}

function setupTeamData(data) {
	const teams = Object.keys(teamLookup.abbr).map(k => teamLookup.abbr[k])
	teamData = teams.map(name => {
		const plays = data.filter(d =>
			d.disadvantaged_team === name || d.committing_team === name
		)
		return { name, plays }
	})
}

function createTable({ teamName, playsData }) {
	chart.select('.game__plays').remove()

	const tableEnter = chart.append('table')
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
		.data(playsData)
		.enter().append('tr')


	trEnter.style('background-color', (d) => {
		const r = d.review_decision
		const c = d.committing_team
		if (r === 'IC') {
			if (c === teamName) return colors.ordinal.ic
			return colors.ordinal.cc
		} else if (r === 'INC') {
			if (c === teamName) return colors.ordinal.cnc
			return colors.ordinal.inc
		}
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

function handleClick(d) {
	// jumpTo(chart.node())
	createTable({ teamName: d.name, playsData: d.plays })
}

function createChart() {
	const teamContainer = chart.append('div').attr('class', 'teams')

	const team = teamContainer.selectAll('.team')
		.data(teamData)
	.enter().append('div')
		.attr('class', 'team')
		.on('click', handleClick)

	team.append('img')
		.attr('class', 'team__logo')
		.attr('src', d => `assets/logos/${d.name}@2x.jpg`)
}

function init() {
	d3.csv('assets/data/web_plays.csv', (err, data) => {
		if (err) console.error(err)
		setupTeamData(data)
		createChart()
	})
}

export default { init }
