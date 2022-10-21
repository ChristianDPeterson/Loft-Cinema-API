function toTitleCase(str) {
    return str
        .toLowerCase()
        .split(" ")
        .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    })
        .join(" ");
}
async function getPageContent(browser, url, waitForSelector) {
    try {
        // Create a new page (tab) in the browser
        const page = await browser.newPage();
        await page.goto(encodeURI(url), { waitUntil: "domcontentloaded" });
        await page
            .waitForSelector(waitForSelector, {
            visible: true,
            timeout: 3000,
        })
            .catch(() => { });
        const pageContents = await page.content();
        await page.close();
        return pageContents;
    }
    catch (error) {
        throw error;
    }
}
function getDateArray(date) {
    return [
        date.year(),
        date.month() + 1,
        date.date(),
        date.hour(),
        date.minute(),
    ];
}
function getDuration(runtime) {
    return {
        hours: Math.floor(runtime / 60),
        minutes: runtime % 60,
    };
}
export { toTitleCase, getPageContent, getDateArray, getDuration };
