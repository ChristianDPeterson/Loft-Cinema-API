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
	const showtimeHTMLElements = Array.from($("h3 > a"));

	const showtimeLinks = showtimeHTMLElements
		.map((showtime) => {
			return showtime.attribs.href;
		})
		.filter((url, index, self) => {
			return self.indexOf(url) === index;
		});

	const times = await Promise.all(
		showtimeLinks.map(async (showtime) => {
			return await getInformation(showtime);
		})
	);

	const filteredTimes = times.filter((time) => {
		return time !== null;
	});

	return filteredTimes;
}

async function getInformation(url) {
	const { data } = await axios.get(encodeURI(url));
	const $ = cheerio.load(data);
	const title = $(".image-header .container h1").text().trim();
	const description = $(".film-content p").text().trim();

	const runtimeString = $(".film-extras h4").text().trim();
	const runtimeHour = parseInt(runtimeString.split(" ")[0]);
	const runtimeMinute = parseInt(runtimeString.split(" ")[2]);
	const runtime =
		isNaN(runtimeHour) || isNaN(runtimeMinute)
			? 120
			: runtimeHour * 60 + runtimeMinute;

	const showtimeLink = $(".showtime-link").prop("href");
	if (!showtimeLink) {
		return null;
	}
	const showtimes = await parseTimes("https://loftcinema.org" + showtimeLink);

	return {
		title,
		description,
		runtime,
		showtimes,
		url,
	};
}

async function parseTimes(url) {
	const { data } = await axios.get(encodeURI(url));
	const $ = cheerio.load(data);
	const times = Array.from($(".date-collection > .selectable-date")).map(
		(time) => {
			const timeString = $(time).attr("data-date").replace(" @ ", " ");
			const dateObject = dayjs
				.utc(timeString, "ddd M/D H:mma")
				.utcOffset(7);
			return dateObject;
		}
	);

	return times;
}

function generateEvents(movies) {
	return movies.reduce((acc, movie) => {
		return [
			...acc,
			...movie.showtimes.map((showtime) => {
				const startTime = [
					showtime.year(),
					showtime.month() + 1,
					showtime.date(),
					showtime.hour(),
					showtime.minute(),
				];

				return {
					calName: "Loft Cinema",
					title: movie.title,
					description: `Get tickets: ${movie.url}\nDescription: ${movie.description}\nRuntime: ${movie.runtime} minutes`,
					start: startTime,
					url: movie.url,
					geo: { lat: 32.236467, lon: -110.923583 },
					duration: {
						hours: Math.floor(movie.runtime / 60),
						minutes: movie.runtime % 60,
					},
				};
			}),
		];
	}, []);
}

async function main() {
	const showtimes = await getShowtimes("https://loftcinema.org/showtimes/");
	const events = generateEvents(showtimes);
	ics.createEvents(events, (error, value) => {
		if (error) {
			console.log(error);
		}
		writeFileSync("event.ics", value);
	});
}

await main();
