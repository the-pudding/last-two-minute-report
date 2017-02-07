setup:
	mkdir processing
	cd processing; mkdir pdf text boxscore html csv output

concat: 
	csvstack output/games/* > .tmp/concat.csv;

latest:
	npm run get-games 10
	npm run parse-games
	make concat
	make merge-incorrect-ref
	git add output/all_games.csv output/games/*.csv process/text/*.txt
	git commit -m 'update with latest data'
	git push

incorrect-call:
	cd custom; python incorrect-call.py;

merge-incorrect-ref:
	csvjoin -c 'play_id,play_id' --outer \
	.tmp/concat.csv custom/incorrect_call_with_ref.csv \
	| csvcut -C play_id2 \
	> output/all_games.csv

copy-data:
	rm -rf web/src/assets/data
	cp -fr analysis/output web/src/assets/data
	csvjson -k key --no-inference analysis/output/web_summary.csv > web/template-data/summary.json