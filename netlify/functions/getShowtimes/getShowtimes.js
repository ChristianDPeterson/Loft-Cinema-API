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
	$(".movielist .movie-info-box").each((i, el) => {
		const movie = removeLastWord(
			$(el).find(".media-heading a").attr("title")
		);
		const times = parseTimes($(el).find(".buttonticket").text());

		times.map((time) => {
			showtimes.push({ cinema, movie, time });
		});
	});
	return showtimes;
};

const removeLastWord = (str) => {
	return str?.substring(0, str.lastIndexOf(" "));
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
