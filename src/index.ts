import "dotenv/config";
import { writeFileSync } from "fs";

import chromium from "chrome-aws-lambda";
import ics from "ics";

import getEvents from "./calendars/LoftCinema.js";

async function main() {
	const browser = await chromium.puppeteer.launch();
	const events = await getEvents(browser);

	console.dir(events);

	ics.createEvents(events, (error, value) => {
		if (error) {
			console.log(error);
		}
		writeFileSync("event.ics", value);
	});

	await browser.close();
}

await main();
