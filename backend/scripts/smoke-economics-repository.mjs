import { economicsRepository } from "../src/repositories/economicsRepository.js";

/**
 * One-time smoke test for economicsRepository methods.
 *
 * Usage:
 *   node --env-file=backend/.env backend/scripts/smoke-economics-repository.mjs
 *   node --env-file=backend/.env backend/scripts/smoke-economics-repository.mjs USA 2022-01-01 2024-12-31
 */

const countryCode = (process.argv[2] || "USA").toUpperCase();
const startDate = process.argv[3] || "2022-01-01";
const endDate = process.argv[4] || "2024-12-31";
const indicatorCodes = ["B1GQ", "P7", "P6", "B11"];

const results = [];

const runCheck = async (name, fn) => {
	try {
		const value = await fn();
		results.push({ name, ok: true, value });
		console.log(`PASS: ${name}`);
	} catch (error) {
		results.push({ name, ok: false, error });
		console.error(`FAIL: ${name}`);
		console.error(error?.message || error);
	}
};

const isObjectOrUndefined = (v) =>
	v === undefined || (v !== null && typeof v === "object");

const main = async () => {
	console.log("Running economicsRepository smoke test...");
	console.log(`Inputs: country=${countryCode}, start=${startDate}, end=${endDate}`);

	await runCheck("getEconomicsDataByCountry", async () => {
		const rows = await economicsRepository.getEconomicsDataByCountry(
			countryCode,
			indicatorCodes,
			startDate,
			endDate,
			"Q"
		);

		if (!Array.isArray(rows)) {
			throw new Error("Expected an array");
		}

		return { rowCount: rows.length };
	});

	await runCheck("getCountryCurrencyMapping", async () => {
		const row = await economicsRepository.getCountryCurrencyMapping(countryCode);

		if (!isObjectOrUndefined(row)) {
			throw new Error("Expected an object or undefined");
		}

		return row;
	});

	const mappingResult = results.find(
		(r) => r.name === "getCountryCurrencyMapping" && r.ok
	)?.value;
	const localCurrencyCode = mappingResult?.currency_code || "USD";

	await runCheck("getCurrencyByCode", async () => {
		const row = await economicsRepository.getCurrencyByCode(localCurrencyCode);

		if (!isObjectOrUndefined(row)) {
			throw new Error("Expected an object or undefined");
		}

		return row;
	});

	await runCheck("getQuarterlyFxRates", async () => {
		const rows = await economicsRepository.getQuarterlyFxRates(
			localCurrencyCode,
			"USD",
			startDate,
			endDate
		);

		if (!Array.isArray(rows)) {
			throw new Error("Expected an array");
		}

		return { rowCount: rows.length, pair: `${localCurrencyCode}/USD` };
	});

	await runCheck("getDailyFxRates", async () => {
		const rows = await economicsRepository.getDailyFxRates(
			localCurrencyCode,
			"USD",
			startDate,
			endDate
		);

		if (!Array.isArray(rows)) {
			throw new Error("Expected an array");
		}

		return { rowCount: rows.length, pair: `${localCurrencyCode}/USD` };
	});

	const failed = results.filter((r) => !r.ok);
	const passed = results.length - failed.length;

	console.log("\nSummary");
	console.log(`Passed: ${passed}`);
	console.log(`Failed: ${failed.length}`);

	if (failed.length > 0) {
		process.exitCode = 1;
	}
};

main().catch((err) => {
	console.error("Unexpected smoke test error:", err);
	process.exitCode = 1;
});
