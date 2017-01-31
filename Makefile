setup:
	mkdir processing
	cd processing; mkdir pdf text boxscore html csv output

concat: 
	csvstack processing/csv/* > .tmp/concat.csv;

latest:
	npm run get-games 10;
	npm run parse-games;
	make concat;
	make merge-incorrect-ref;
	git add output/all_games.csv;
	git commit -m 'update with latest data';
	git push;

incorrect-call:
	python analysis/incorrect-calls.py;

merge-incorrect-ref:
	csvjoin -c 'play_id,play_id' --outer \
	.tmp/concat.csv analysis/incorrect_calls_with_ref.csv \
	| csvcut -C play_id2 \
	> output/all_games.csv
	