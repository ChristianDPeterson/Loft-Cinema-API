const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

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

			const times = parseTimes($(el).find(".buttonticket").text());

			times.map((time) => {
				const showtime = { cinema, movie, time, runtime, description };
				// console.log(showtime);
				showtimes.push(showtime);
			});
		})
	);
	console.log(showtimes);
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
	const showtimes = [];

	const dates = timeString
		.split(/Sun, |Mon, |Tue, |Wed, |Thu, |Fri, |Sat, /)
		.filter(Boolean); // remove empty strings

	dates.map((date) => {
		const month = date.substring(0, date.indexOf(" "));
		const day = date.substring(date.indexOf(" ") + 1, date.indexOf(":"));
		const timeList = date.substring(date.indexOf(":") + 1);

		// split the list of times into seperate strings
		const times = timeList
			.split(/(?<=m)/)
			.filter(Boolean)
			.map((time) => {
				const dateString = `${month} ${day} ${time}`;
				const dateObject = dayjs(dateString, "MMM D hh:mma").toDate();
				showtimes.push(dateObject);
			});
	});

	return showtimes;
};

exports.handler = async (event) => {
	const showtimes = await getShowtimes(
		"https://www.showtimes.com/movie-theaters/loft-cinema-12077/?date=all"
	);
	return {
		statusCode: 200,
		body: JSON.stringify({ showtimes: showtimes }),
	};
};
