/*
convert text files to csv
*/

const cwd = process.cwd()

const fs = require('fs')
const shell = require('shelljs')
const cheerio = require('cheerio')
const d3 = require('d3')
const teamLookup = require('./team-lookup.js')

const REVIEW_TYPES = ['CC', 'IC', 'CNC', 'INC']
const DEBUG = false

function cleanLines(lines) {
	return lines
		.map(line =>
			// split each line by 2+ whitespace (tabs between columns)
			// trim and remove empties
			line.split(/\s{2,}/)
				.map(chunk => chunk.trim())
				.filter(chunk => chunk.length > 1)
		)
		.filter(line => line.length)
}

function parseAwayTeam(str) {
	return str.split('(')[0].trim()
}

function parseHomeTeam(str) {
	return str.split('(')[0].trim()
}

function parseDate(str) {
	return str.replace(/\)/g, '').split('(').pop().trim()
}


function extractGameInfo(lines) {
	// nba uses two versions...
	// eg 1: Pacers @ 76ers (Nov 11, 2016)
	// eg 2: Knicks (98) @ Hawks (102) (Dec 28, 2016)

	const match = lines
		.map(line => line.join(' '))
		.filter(line => line.indexOf('@') > -1)
		.find((line) => {
			const afterAt = line.split('@')[1].trim()
			const possibleTeam = afterAt.split('(')[0].trim()
			return teamLookup.abbr[possibleTeam]
		})

	if (match) {
		const split = match.split('@')

		const away = parseAwayTeam(split[0])
		const home = parseHomeTeam(split[1])
		const date = parseDate(split[1])

		// nba uses full month and abbr sometimes...
		const month = date.split(' ')[0]
		const monthFormat = month.length === 3 ? 'b' : 'B'
		const parsedDate = d3.timeParse(`%${monthFormat} %d, %Y`)(date)
		const formattedDate = d3.timeFormat('%Y%m%d')(parsedDate)

		const awayAbbr = teamLookup.abbr[away]
		const homeAbbr = teamLookup.abbr[home]

		// create basketball reference link from date + home team
		const bballRefAbbr = teamLookup.abbrBasketballReference[home]
		const boxscoreURL = `${formattedDate}0${bballRefAbbr}.html`

		// generate a unique id for the game
		const id = `${formattedDate}${awayAbbr}${homeAbbr}`
		return { 
			game_id: id,
			away: awayAbbr,
			home: homeAbbr,
			date: formattedDate,
			boxscore_url: boxscoreURL,
		}
	}

	return null
}

function getTeamFromComment({ player, comment }) {
	if (player && comment) {
		// just last name
		const startLastName = player.indexOf(' ') + 1
		const lastName = player.substring(startLastName, player.length)
		const nameLength = lastName.length

		// strip whitespace and deal with 's and what not
		const cleanComment = comment
			.replace(/'s/g, '')
			.replace(/' /g, ' ')
			.replace(/ /g, '')

		const nameWithTeamIndex = cleanComment.indexOf(`${lastName}(`) + 1
		// added 1 above so 0 not -1
		if (nameWithTeamIndex > 0) {
			const startTeam = nameWithTeamIndex + nameLength
			const team = cleanComment.substring(startTeam, startTeam + 3)
			return team
		}
	}

	return null
}

function getCommittingPlayer(d) {
	const MAX = 7
	// check to see if there is a review decision
	const joined = d.join(' ')
	let review = false
	REVIEW_TYPES.forEach((r) => {
		if (joined.indexOf(r) > -1) review = true
	})

	if (d.length === MAX) return d[3]
	else if (d.length === MAX - 1) return d[3]
	else if (d.length === MAX - 2) return review ? null : d[3]
	return null
}

function getDisdvantagedPlayer(d) {
	const MAX = 7
	// check to see if there is a review decision
	const joined = d.join(' ')
	let review = false
	REVIEW_TYPES.forEach((r) => {
		if (joined.indexOf(r) > -1) review = true
	})

	if (d.length === MAX) return d[4]
	else if (d.length === 6 && !review) return d[4]

	return null
}

function getReviewDecision(d) {
	const MAX = 7
	// check to see if there is a review decision
	const joined = d.join(' ')
	let hasReview = false
	REVIEW_TYPES.forEach((r) => {
		if (joined.indexOf(r) > -1) hasReview = true
	})

	let review = ''

	if (d.length === MAX) review = d[5]
	else if (d.length === 6 && hasReview) review = d[4]
	else if (d.length === 5 && hasReview) review = d[3]

	if (review) return review.replace('*', '')

	return null
}

function getSeconds(str) {
	const split = str.split(':')
	const min = +split[0]
	const sec = +split[1]

	return (min * 60) + sec
}

function extractReviews({ lines, videoURLs }) {
	const details = lines.filter(line => line[0].match(/Q\d/) && line[0].length === 2)
	const comments = lines.filter(line => line[0].startsWith('Comment:'))
	const reviews = details.map((d, i) => ({
		period: d[0],
		time: d[1],
		seconds_left: getSeconds(d[1]),
		call_type: d[2],
		committing_player: getCommittingPlayer(d),
		disadvantaged_player: getDisdvantagedPlayer(d),
		review_decision: getReviewDecision(d),
		comment: comments[i][1],
		video: videoURLs[i],
	}))

	// add in team
	const reviewsWithTeam = reviews.map(d => ({
		...d,
		committing_team: getTeamFromComment({
			player: d.committing_player,
			comment: d.comment,
		}),
		disadvantaged_team: getTeamFromComment({
			player: d.disadvantaged_player,
			comment: d.comment,
		}),
	}))

	return reviewsWithTeam
}

function extractVideoURLs($) {
	const urls = []
	$('a').each((i, el) => {
		const url = $(el).attr('href')
		const valid = url && url.startsWith('http://official.nba.com/')
		if (valid) urls.push(url.trim())
	})
	return urls
}

function extractRefs($) {
	const refs = []
	$('body').find('strong').each((i, el) => {
		const text = $(el).text().trim()
		if (text === 'Officials:') {
			$(el).nextAll().each((i2, el2) => {
				if (i2 < 3) refs.push($(el2).text().trim())
			})
		}
	})
	return refs
}

function extractScore($) {
	const score = []
	$('.scorebox').find('.score').each((i, el) => {
		score.push($(el).text().trim())
	})
	return score
}

function getBoxscoreInfo(info, cb) {
	const file = `${cwd}/processing/boxscore/${info.boxscore_url}`
	const local = fs.existsSync(file)

	// cache bball reference page
	const url = `http://www.basketball-reference.com/boxscores/${info.boxscore_url}`
	if (!local) {
		const command = `curl -o processing/boxscore/${info.boxscore_url} ${url}`
		shell.exec(command, { silent: true })
	}

	const $ = cheerio.load(fs.readFileSync(file))
	const refs = extractRefs($)
	const score = extractScore($)
	cb({ refs, score, url })
}

function createPlayID(d, info) {
	const clean = str => str ? String(str).replace(/\W/g, '') : ''

	const parts = [
		info.game_id,
		clean(d.seconds_left),
		clean(d.disadvantaged_player).slice(0, 3),
		clean(d.committing_player).slice(0, 3),
		clean(d.comment).slice(0, 3),
	]
	return parts.join('').toLowerCase()
}

function parse(file, cb) {
	// load txt file into array of lines
	const lines = fs.readFileSync(`${cwd}/processing/text/${file}.txt`)
		.toString()
		.split('\n')

	// load html file so we can get video links
	const $ = cheerio.load(fs.readFileSync(`${cwd}/processing/html/${file}.html`))

	// clean each line
	const clean = cleanLines(lines)

	// extract video links from html
	const videoURLs = extractVideoURLs($)

	// make clean objects for each review data
	const reviews = extractReviews({ lines: clean, videoURLs })

	// grab the teams and date
	const info = extractGameInfo(clean)

	// get boxscore info and integrate into data rows
	getBoxscoreInfo(info, ({ refs, score, url }) => {
		const reviewsWithBoxscore = reviews.map(d => ({
			...d,
			game_id: info.game_id,
			play_id: createPlayID(d, info),
			away: info.away,
			home: info.home,
			date: info.date,
			ref_1: refs[0],
			ref_2: refs[1],
			ref_3: refs[2],
			score_away: score[0],
			score_home: score[1],
			original_pdf: `${file}`,
			box_score_url: url,
		}))

		// write out data
		const csvOut = d3.csvFormat(reviewsWithBoxscore)
		if (DEBUG) console.log(JSON.stringify(reviewsWithBoxscore, null, 2))
		else fs.writeFileSync(`${cwd}/processing/csv/${info.game_id}.csv`, csvOut)
		cb()
	})
}

function init() {
	const fileInput = fs.readdirSync(`${cwd}/processing/text`).filter(file => file.endsWith('.txt'))
	// const files = DEBUG ? ['L2M-BKN-ORL-12-16-16.pdf'] : fileInput
	const files = DEBUG ? ['Wozards-110-Hornets-107-OT.pdf'] : fileInput

	const len = files.length
	let i = 0

	const next = () => {
		const file = files[i].replace('.txt', '')
		console.log(i, file)
		parse(file, () => {
			i += 1
			if (i < len) next()
		})
	}

	if (len > 0) next()
}


init()
