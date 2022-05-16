import "dotenv/config";
import { writeFileSync } from "fs";

import axios from "axios";
import cheerio from "cheerio";
import ics from "ics";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

async function getShowtimes(url) {
	const { data } = await axios.get(encodeURI(url));
	const $ = cheerio.load(data);

	const showtimeHTMLElements = Array.from($(".movielist .movie-info-box"));
	const allShowtimes = await showtimeHTMLElements.reduce(async (prev, el) => {
		const cinema = $(".fav-h1 h1").text().trim();
		const movieElement = $(el).find(".media-heading a").attr("title");
		const movie = movieElement
			? movieElement.replace(" info", "")
			: $(el).find(".media-heading").text().trim();

		const movieDetails = await queryMovie(movie);
		const runtime = movieDetails?.runtime ?? 120;
		const description = movieDetails?.overview ?? "No description found";

		const timeString = $(el).find(".buttonticket").text();
		const showtimes = parseTimes(timeString).map((time) => {
			return { cinema, movie, time, runtime, description };
		});

		return [...(await prev), ...showtimes];
	}, []);

	console.log(allShowtimes);
	return allShowtimes;
}

async function queryMovie(title) {
	// change into query string
	const queryString = title?.split(" ").join("+").toLowerCase();

	// get movieId from themoviedb
	const { data: movieQuery } = await axios.get(
		encodeURI(
			`https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${queryString}&page=1`
		)
	);

	if (!movieQuery || !movieQuery.results || movieQuery.results.length === 0) {
		return null;
	}

	const id = movieQuery.results[0].id;

	// get details on movie
	const { data: movieDetail } = await axios.get(
		encodeURI(
			`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`
		)
	);

	return movieDetail ? movieDetail : null;
}

function parseTimes(timeString) {
	const dates = timeString
		.split(/Sun, |Mon, |Tue, |Wed, |Thu, |Fri, |Sat, /)
		.filter(Boolean); // remove empty strings

	const showtimes = dates.reduce((prev, date) => {
		const month = date.substring(0, date.indexOf(" "));
		const day = date.substring(date.indexOf(" ") + 1, date.indexOf(":"));
		const timeList = date.substring(date.indexOf(":") + 1);

		const times = timeList
			.split(/(?<=m)/) // split on "m" from "am" or "pm"
			.filter(Boolean) // remove empty strings
			.map((time) => {
				const dateString = `${month} ${day} ${time}`;
				const dateObject = dayjs
					.utc(dateString, "MMM D hh:mma")
					.utcOffset(7);
				return dateObject;
			});

		return [...prev, ...times];
	}, []);

	return showtimes;
}

function generateEvents(showtimes) {
	return showtimes.map((showtime) => {
		const startTime = [
			showtime.time.year(),
			showtime.time.month() + 1,
			showtime.time.date(),
			showtime.time.hour(),
			showtime.time.minute(),
		];

		return {
			calName: "Loft Cinema",
			title: showtime.movie,
			description: showtime.description,
			start: startTime,
			duration: {
				hours: Math.floor(showtime.runtime / 60),
				minutes: showtime.runtime % 60,
			},
		};
	});
}

async function main() {
	const showtimes = await getShowtimes(
		"https://www.showtimes.com/movie-theaters/loft-cinema-12077/?date=all"
	);
	const events = generateEvents(showtimes);
	ics.createEvents(events, (error, value) => {
		if (error) {
			console.log(error);
		}
		writeFileSync("event.ics", value);
	});
}

await main();
