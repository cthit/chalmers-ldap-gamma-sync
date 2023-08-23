const axios = require("axios");
const ldap = require("ldapjs");

const COLOR_RESET = "\x1b[0m";
const FG_YELLOW = "\x1b[33m";
const BG_RED = "\x1b[41m";

const client = ldap.createClient({
	url: "ldap://ldap.chalmers.se",
});

(async function () {
	console.log("Sync started");
	const cids = await new Promise((resolve, _) => {
		console.log("Connecting to LDAP...");
		client.search(
			"ou=groups,dc=chalmers,dc=se",
			{
				filter: "cn=" + process.env.CHALMERS_GROUP,
				scope: "sub"
			},
			(err, res) => {
				if (err) {
					console.error("LDAP connection failed:", err.message);
					process.exit(1);
				}

				res.on("searchEntry", (entry) => {
					resolve(entry.object.memberUid);
				});
			}
		);
	});

	if (!cids) {
		console.error(BG_RED + "No CIDs found" + COLOR_RESET);
		process.exit(0);
	}

	console.log("The following", cids.length, "CIDs were found and will be added:");
	console.dir(cids, {depth: null, colors: true, maxArrayLength: null});
	console.log("\nAdding CIDs...");

	// Lägg till dem en och en eftersom att det krashar annars
	const results = await Promise.allSettled(
		cids.map(async (cid) => {
			await axios({
				method: "POST",
				url: "https://gamma.chalmers.it/api/admin/users/whitelist",
				data: {
					cids: [cid],
				},
				headers: {
					Authorization: "pre-shared " + process.env.GAMMA_API_KEY,
					"Content-Type": "application/json",
				},
			});
		})
	);

	const cidResults = results.map((r, idx) => { return {result: r, cid: cids[idx]} });
	const failed = cidResults.filter((r) => r.result.status === "rejected")
								.map((r) => r.cid + ": " + FG_YELLOW + r.result.reason.message + COLOR_RESET);

	console.log(cids.length - failed.length, "added,", failed.length, "failed out of", cids.length, "total");

	if (failed.length > 0) {
		console.warn("\n" + BG_RED + "The following CIDs failed to add:" + COLOR_RESET);
		failed.forEach((f) => console.warn(f));
	}

	process.exit(0);
})();
