const axios = require("axios");
const ldap = require("ldap");

const client = ldap.createClient({
	url: "ldap://ldap.chalmers.se",
});

(async function () {
	let cids = await new Promise((resolve, reject) => {
		client.search(
			"ou=groups,dc=chalmers,dc=se",
			{
				filter: "cn=" + process.env.CHALMERS_GROUP,
				scope: "sub",
			},
			(err, res) => {
				if (err) {
					reject(err);
				}

				res.on("searchEntry", (entry) => {
					resolve(entry.object.memberUid);
				});
			}
		);
	});
	console.log("Found", cids.length, "CIDs");
	console.debug(dir(cids, {depth: null, colors: true, maxArrayLength: null}));

	// Lägg till dem en och en eftersom att det krashar annars
	await Promise.all(
		cids.map(async (cid) => {
			try {
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
				console.log("Added:", cid);
			} catch (e) {
				console.error("Could not add", cid + ":", e.message);
			}
		})
	);

	process.exit(0);
})();
