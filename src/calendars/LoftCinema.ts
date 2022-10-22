import {
	toTitleCase,
	getPageContent,
	getDateArray,
	getDuration,
} from "../utils/utils.js";

import type { EventAttributes } from "ics";
import cheerio from "cheerio";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(customParseFormat);
dayjs.extend(utc);

import type { Browser } from "puppeteer-core";

const getLoftCinemaEvents = async (
	browser: Browser
): Promise<EventAttributes[]> => {
	return await getShowtimes("https://loftcinema.org/showtimes/", browser);
};

async function getShowtimes(url: string, browser: Browser): Promise<any[]> {
	const data = await getPageContent(browser, url, ".date-showings");
	const $ = cheerio.load(data);
	const showtimeHTMLElements = Array.from($("h3 > a"));

	const showtimeLinks = showtimeHTMLElements
		.map((showtime) => {
			return showtime.attribs.href;
		})
		.filter((url, index, self) => {
			return self.indexOf(url) === index;
		});

	const events = (
		await Promise.all(
			showtimeLinks.map((link) =>
				getInformation(link, browser, "Loft Cinema")
			)
		)
	).flat();

	return events;
}

async function getInformation(
	url: string,
	browser: Browser,
	calendarName: string
): Promise<EventAttributes[]> {
	const events: EventAttributes[] = [];

	const data = await getPageContent(browser, url, ".date-collection-wrapper");

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
		const timeString = $(".film-headlines > h3")
			.text()
			.trim()
			.replace(" AT ", " ")
			.replace(", ", " ")
			.replace("TH ", " ")
			.split(" ")
			.slice(1)
			.join(" ");
		const titleCase = toTitleCase(timeString);
		if (dayjs(titleCase, "MMMM D h:mma", true).isValid()) {
			const showtime = dayjs.utc(titleCase, "MMMM D h:mma").utcOffset(7);
			events.push({
				calName: calendarName,
				title,
				description: `Get tickets: ${url}\nDescription: ${description}\nRuntime: ${runtime} minutes`,
				url,
				duration: getDuration(runtime),
				start: getDateArray(showtime),
			});
		}
	} else {
		Array.from($(".date-collection > .selectable-date")).forEach((time) => {
			const timeString = $(time).attr("data-date")?.replace(" @ ", " ");
			const dateObject = dayjs
				.utc(timeString, "ddd M/D H:mma")
				.utcOffset(7);
			events.push({
				calName: calendarName,
				title,
				description,
				url,
				duration: getDuration(runtime),
				start: getDateArray(dateObject),
			});
		});
	}

	return events;
}

export default getLoftCinemaEvents;
