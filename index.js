import "dotenv/config";
import axios from "axios";
import cheerio from "cheerio";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
// import utc from "dayjs/plugin/utc.js";
// import tz from "dayjs/plugin/timezone.js";

import ics from "ics";
import { writeFileSync } from "fs";

dayjs.extend(customParseFormat);
// dayjs.extend(utc);
// dayjs.extend(tz);

const getShowtimes = async (url) => {
	const { data } = await axios.get(url);
	const $ = cheerio.load(data);
	const cinema = $(".fav-h1 h1").text().trim();
	const showtimes = [];
	await Promise.all(
		$(".movielist .movie-info-box").map(async (i, el) => {
			let movie = $(el)
				.find(".media-heading a")
				.attr("title")
				?.replace(" info", "");

			if (!movie) {
				movie = "No movie title found";
			}

			const movieDetails = await queryMovie(movie);
			const runtime = movieDetails?.runtime ? movieDetails.runtime : 120;
			const description = movieDetails?.overview
				? movieDetails.overview
				: "No description found";

			const timeString = $(el).find(".buttonticket").text();
			const times = parseTimes(timeString);

			times.map((time) => {
				const showtime = { cinema, movie, time, runtime, description };
				showtimes.push(showtime);
			});
		})
	);
	return showtimes;
};

const queryMovie = async (title) => {
	// change into query string
	const queryString = title?.split(" ").join("+").toLowerCase();

	// get movieId from themoviedb
	const { data: movieQuery } = await axios.get(
		`https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${queryString}&page=1`
	);

	if (!movieQuery || !movieQuery.results || movieQuery.results.length === 0) {
		return null;
	}

	const id = movieQuery.results[0].id;

	// get details on movie
	const { data: movieDetail } = await axios.get(
		`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`
	);

	if (!movieDetail) {
		return null;
	}

	return movieDetail;
};

const parseTimes = (timeString) => {
	let showtimes = [];

	const dates = timeString
		.split(/Sun, |Mon, |Tue, |Wed, |Thu, |Fri, |Sat, /)
		.filter(Boolean); // remove empty strings

	dates.forEach((date) => {
		const month = date.substring(0, date.indexOf(" "));
		const day = date.substring(date.indexOf(" ") + 1, date.indexOf(":"));
		const timeList = date.substring(date.indexOf(":") + 1);

		const times = timeList
			.split(/(?<=m)/) // split on "m" from "am" or "pm"
			.filter(Boolean) // remove empty strings
			.map((time) => {
				const dateString = `${month} ${day} ${time}`;
				console.log(dateString);
				const dateObject = dayjs(dateString, "MMM D hh:mma");
				// .tz("America/Phoenix")
				// .utc();
				console.log(dateObject);
				return dateObject;
			});

		showtimes = [...showtimes, ...times];
	});

	return showtimes;
};

const generateEvents = (showtimes) => {
	const events = [];
	showtimes.forEach((showtime) => {
		const startTime = [
			showtime.time.year(),
			showtime.time.month() + 1,
			showtime.time.date(),
			showtime.time.hour(),
			showtime.time.minute(),
		];

		events.push({
			calName: "Loft Cinema",
			title: showtime.movie,
			description: showtime.description,
			start: startTime,
			// startInputType: showtime.time.isUTC() ? "utc" : "local",
			duration: {
				hours: Math.floor(showtime.runtime / 60),
				minutes: showtime.runtime % 60,
			},
		});
	});
	return events;
};

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
