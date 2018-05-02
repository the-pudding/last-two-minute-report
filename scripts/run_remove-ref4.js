const cwd = process.cwd();

const fs = require('fs');
const shell = require('shelljs');
const d3 = require('d3');

function init() {
	const files = fs
		.readdirSync(
			`${cwd}/output/games`,
		)
		.filter(
			file =>
				file.endsWith(
					'.csv',
				),
		);

	files.forEach(
		(f) => {
			const cols =
				'period,time,seconds_left,call_type,committing_player,disadvantaged_player,review_decision,comment,video,game_id,play_id,away,home,date,ref_1,ref_2,ref_3,score_away,score_home,original_pdf,box_score_url,disadvantaged_team,committing_team';
			const cmd = `csvcut -c ${cols} ${cwd}/output/games/${f} > ${cwd}/.tmp/games/${f}`;
			shell.exec(
				`${cmd}`,
			);
		},
	);
}

init();
