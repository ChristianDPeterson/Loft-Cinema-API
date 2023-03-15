import type { Dayjs } from "dayjs";
import type { DateArray, DurationObject } from "ics";
import { Browser } from "puppeteer-core";

async function getPageContent(
	browser: Browser,
	url: string,
	waitForSelector?: string
): Promise<string> {
	try {
		// Create a new page (tab) in the browser
		const page = await browser.newPage();

		await page.goto(encodeURI(url), { waitUntil: "domcontentloaded" });

		if (!!waitForSelector) {
			await page
				.waitForSelector(waitForSelector, {
					visible: true,
					timeout: 10000,
				})
				.catch(() => {});
		}

		const pageContents = await page.content();
		await page.close();
		return pageContents;
	} catch (error) {
		throw error;
	}
}

function getDateArray(date: Dayjs): DateArray {
	return [
		date.year(),
		date.month() + 1,
		date.date(),
		date.hour(),
		date.minute(),
	];
}

function getDuration(runtime: number): DurationObject {
	return {
		hours: Math.floor(runtime / 60),
		minutes: runtime % 60,
	};
}

function toTitleCase(str: string): string {
	return str
		.toLowerCase()
		.split(" ")
		.map(function (word) {
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");
}

export { toTitleCase, getPageContent, getDateArray, getDuration };
