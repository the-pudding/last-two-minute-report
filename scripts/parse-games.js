/*
convert text files to csv
*/
const DEBUG = false;

const cwd = process.cwd();

const fs = require('fs');
const shell = require('shelljs');
const cheerio = require('cheerio');
const d3 = require('d3');
const teamLookup = require('./team-lookup.js');

const REVIEW_TYPES = ['CC', 'IC', 'CNC', 'INC'];

const badFormatGames = [];

function cleanLines(lines) {
	return lines
		.map(line =>
			// split each line by 2+ whitespace (tabs between columns)
			// trim and remove empties
			line
				.split(/\s{2,}/)
				.map(chunk => chunk.trim())
				.filter(chunk => chunk.length > 1),
		)
		.filter(line => line.length);
}

function parseAwayTeam(str) {
	return str.split('(')[0].trim();
}

function parseHomeTeam(str) {
	return str.split('(')[0].trim();
}

function parseDate(str) {
	// 2017-18
	const trim = str.trim();
	// OLD VERSION
	if (trim.charAt(trim.length - 1) === ')') {
		return str
			.replace(/\)/g, '')
			.split('(')
			.pop()
			.trim();
	}

	return str.split(')')[1].trim();
}

function extractGameInfo(lines) {
	// nba uses two versions...
	// eg 1: Pacers @ 76ers (Nov 11, 2016)
	// eg 2: Knicks (98) @ Hawks (102) (Dec 28, 2016)
	// eg 3: Celtics (99) @ Cavaliers (102) October 17, 2017

	const match = lines
		.map(line => line.join(' '))
		.filter(line => line.indexOf('@') > -1)
		.find((line) => {
			const afterAt = line.split('@')[1].trim();
			const possibleTeam = afterAt.split('(')[0].trim();
			return teamLookup.abbr[possibleTeam];
		});

	if (match) {
		const split = match.split('@');

		const away = parseAwayTeam(split[0]);
		const home = parseHomeTeam(split[1]);
		const date = parseDate(split[1]);

		// nba uses full month and abbr sometimes...
		const month = date.split(' ')[0];
		const monthFormat = month.length === 3 ? 'b' : 'B';
		const parsedDate = d3.timeParse(`%${monthFormat} %d, %Y`)(date);
		const formattedDate = d3.timeFormat('%Y%m%d')(parsedDate);

		const awayAbbr = teamLookup.abbr[away];
		const homeAbbr = teamLookup.abbr[home];

		// create basketball reference link from date + home team
		const bballRefAbbr = teamLookup.abbrBasketballReference[home];
		const boxscoreURL = `${formattedDate}0${bballRefAbbr}.html`;

		// generate a unique id for the game
		const id = `${formattedDate}${awayAbbr}${homeAbbr}`;
		return {
			game_id: id,
			away: awayAbbr,
			home: homeAbbr,
			date: formattedDate,
			boxscore_url: boxscoreURL,
		};
	}

	return null;
}

function getTeamFromComment({ player, comment }) {
	if (player && comment) {
		// just last name
		const startLastName = player.indexOf(' ') + 1;
		const lastName = player.substring(startLastName, player.length).replace(/ /g, '');

		const nameLength = lastName.length;

		// strip whitespace and deal with 's and what not
		const cleanComment = comment
			.replace(/'s/g, '')
			.replace(/' /g, ' ')
			.replace(/ /g, '');

		const nameWithTeamIndex = cleanComment.indexOf(`${lastName}(`) + 1;
		// added 1 above so 0 not -1
		if (nameWithTeamIndex > 0) {
			const startTeam = nameWithTeamIndex + nameLength;
			const team = cleanComment.substring(startTeam, startTeam + 3);
			return team;
		}
	}

	return null;
}

function getCommittingPlayer(d) {
	const MAX = 7;
	// check to see if there is a review decision
	const joined = d.join(' ');
	let review = false;
	REVIEW_TYPES.forEach((r) => {
		if (joined.indexOf(r) > -1) review = true;
	});

	if (d.length === MAX) return d[3];
	else if (d.length === MAX - 1) return d[3];
	else if (d.length === MAX - 2) return review ? null : d[3];
	return null;
}

function getDisdvantagedPlayer(d) {
	const MAX = 7;
	// check to see if there is a review decision
	const joined = d.join(' ');
	let review = false;
	REVIEW_TYPES.forEach((r) => {
		if (joined.indexOf(r) > -1) review = true;
	});

	if (d.length === MAX) return d[4];
	else if (d.length === 6 && !review) return d[4];

	return null;
}

function getReviewDecision(d) {
	const MAX = 7;
	// check to see if there is a review decision
	const joined = d.join(' ');
	let hasReview = false;
	REVIEW_TYPES.forEach((r) => {
		if (joined.indexOf(r) > -1) hasReview = true;
	});

	let review = '';

	if (d.length === MAX) review = d[5];
	else if (d.length === 6 && hasReview) review = d[4];
	else if (d.length === 5 && hasReview) review = d[3];

	if (review) return review.replace('*', '');

	return null;
}

function getSeconds(str) {
	const split = str.split(':');
	const min = +split[0];
	const sec = +split[1];

	return min * 60 + sec;
}

function buildComment({ line, index }, lines) {
	let done = false;
	let output = line[1];
	let i = index + 1;

	while (!done) {
		// test end
		if (lines[i]) {
			const quarter = lines[i][0].match(/Q\d/) && lines[i][0].length === 2;
			const common = lines[i][0].startsWith('Common');
			if (quarter || common) done = true;
			else output = `${output} ${lines[i][0]}`;
		}
		if (i >= lines.length) done = true;
		i += 1;
	}

	return output;
}

function extractComments(lines) {
	const linesWithIndex = lines.map((line, index) => ({ line, index }));
	const commentStart = linesWithIndex.filter(d => d.line[0].startsWith('Comment:'));
	// go thru each, and add following lines until you hit Q or Common
	const comments = commentStart.map(d => buildComment(d, lines));
	return comments;
}

function extractReviews({ lines, videoURLs }) {
	const details = lines.filter(line => line[0].match(/Q\d/) && line[0].length === 2);

	const comments = extractComments(lines);

	const reviews = details.map((d, i) => ({
		period: d[0],
		time: d[1],
		seconds_left: getSeconds(d[1]),
		call_type: d[2],
		committing_player: getCommittingPlayer(d),
		disadvantaged_player: getDisdvantagedPlayer(d),
		review_decision: getReviewDecision(d),
		comment: comments[i],
		video: videoURLs[i],
	}));

	return reviews;
}

function extractVideoURLs($) {
	const urls = [];
	$('a').each((i, el) => {
		const url = $(el).attr('href');
		const valid = url && url.startsWith('http://official.nba.com/');
		if (valid) urls.push(url.trim());
	});
	return urls;
}

function extractRefs($) {
	const refs = [];
	$('body')
		.find('strong')
		.each((i, el) => {
			const text = $(el)
				.text()
				.trim();
			if (text === 'Officials:') {
				$(el)
					.nextAll()
					.each((i2, el2) => {
						if (i2 < 3) {
							refs.push(
								$(el2)
									.text()
									.trim(),
							);
						}
					});
			}
		});
	return refs;
}

function extractScore($) {
	const score = [];
	$('.scorebox')
		.find('.score')
		.each((i, el) => {
			score.push(
				$(el)
					.text()
					.trim(),
			);
		});
	return score;
}

function getBoxscoreInfo(info, cb) {
	const file = `${cwd}/processing/boxscore/${info.boxscore_url}`;
	const local = fs.existsSync(file);
	// cache bball reference page
	const url = `https://www.basketball-reference.com/boxscores/${info.boxscore_url}`;
	if (!local) {
		const command = `curl -o processing/boxscore/${info.boxscore_url} ${url}`;
		shell.exec(command, { silent: true });
	}

	const $ = cheerio.load(fs.readFileSync(file));
	const refs = extractRefs($);
	const score = extractScore($);
	cb({ refs, score, url });
}

function getCommittingAndDisadvantagedTeams(d) {
	let committing = getTeamFromComment({
		player: d.committing_player,
		comment: d.comment,
	});

	let disadvantaged = getTeamFromComment({
		player: d.disadvantaged_player,
		comment: d.comment,
	});

	// if dis is blank
	if (committing && !disadvantaged) {
		disadvantaged = committing === d.home ? d.away : d.home;
	}
	// if com is blank
	if (disadvantaged && !committing) {
		committing = disadvantaged === d.home ? d.away : d.home;
	}

	return { committing, disadvantaged };
}

function checkBadFormat(reviews) {
	let bad = false;
	reviews.forEach((review) => {
		const noComment = !review.comment || !review.comment.trim().length;
		const noSeconds = isNaN(review.seconds_left);
		if (noComment || noSeconds) bad = true;
	});
	return bad;
}

function parse({ index, file }, cb) {
	// load txt file into array of lines
	// always check if there is a modified version first
	const modifiedFile = `${cwd}/processing/text/${file}-mod.txt`;
	const rawFile = `${cwd}/processing/text/${file}.txt`;
	const modExists = fs.existsSync(modifiedFile);
	const filepath = modExists ? modifiedFile : rawFile;

	console.log(index, file, modExists ? 'modified' : '');

	const fileText = fs.readFileSync(filepath).toString();

	// PHOENIX HACK
	const hack = fileText.replace(/\(PHX\)/g, '(PHO)');

	const lines = hack.split('\n');

	// load html file so we can get video links
	const $ = cheerio.load(fs.readFileSync(`${cwd}/processing/html/${file}.html`));

	// clean each line
	const clean = cleanLines(lines);

	// extract video links from html
	const videoURLs = extractVideoURLs($);

	// make clean objects for each review data
	const reviews = extractReviews({ lines: clean, videoURLs });

	// grab the teams and date
	const info = extractGameInfo(clean);

	// alert if we have bad formatting
	const badFormat = checkBadFormat(reviews);

	if (badFormat) badFormatGames.push(file);

	// get boxscore info and integrate into data rows
	getBoxscoreInfo(info, ({ refs, score, url }) => {
		const reviewsWithBoxscore = reviews.map((d, i) => ({
			...d,
			game_id: info.game_id,
			play_id: `${info.game_id}-${i}`,
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
		}));

		// add in teams
		const reviewsWithTeam = reviewsWithBoxscore.map((d) => {
			const teams = getCommittingAndDisadvantagedTeams(d);
			return {
				...d,
				disadvantaged_team: teams.disadvantaged,
				committing_team: teams.committing,
			};
		});

		// write out data
		const csvOut = d3.csvFormat(reviewsWithTeam);
		if (DEBUG) console.log(JSON.stringify(reviewsWithTeam, null, 2));
		else fs.writeFileSync(`${cwd}/output/games/${info.game_id}.csv`, csvOut);
		cb();
	});
}

function init() {
	const ms = new Date().getTime();
	const hour = 3600000;
	const fileInput = fs
		.readdirSync(`${cwd}/processing/text`)
		.filter(file => file.endsWith('pdf.txt'));

	const files = DEBUG ? ['L2M-BOS-CLE-10-17-2017.pdf', 'L2M-HOU-GSW-10-17-2017.pdf'] : fileInput;

	const len = files.length;
	let index = 0;

	const next = () => {
		const file = files[index].replace('.txt', '');

		const stats = fs.statSync(`${cwd}/processing/text/${file}.txt`);
		const diff = ms - stats.birthtimeMs;
		if (diff < hour) {
			parse({ file, index }, () => {
				index += 1;
				if (index < len) next();
				else console.log('bad format games:', badFormatGames);
			});
		} else {
			index += 1;
			if (index < len) next();
		}
	};

	if (len > 0) next();
}

init();
